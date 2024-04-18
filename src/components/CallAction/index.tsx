import {
    ACT_CRM_URL,
    DATE_FORMAT, EVENT_KEY, WAVE_CALL_TYPE
} from "@/constant";
import { formatDescription, formatPhoneNumber, getNotificationBody, getValueByConfig } from "@/utils/utils";
import { get } from "lodash";
import moment from "moment-timezone";
import React, { useCallback, useEffect, useRef } from "react";
import { Dispatch, GlobalModelState, connect, useIntl } from 'umi';

interface IndexProps {
    getContact: (obj: LooseObject) => Promise<any>
    putInteraction: (obj: LooseObject) => void
    createContact: (obj: LooseObject) => Promise<LooseObject>
    userConfig: LooseObject
    user: LooseObject
}

const IndexPage: React.FC<IndexProps> = ({ getContact, putInteraction, createContact, userConfig, user }) => {

    const { formatMessage } = useIntl();

    const waveUserInfo = useRef<LooseObject>({})

    const callNumber = useRef<string | null>(null);

    // 当用户网络速度较慢时，获取联系人接口还未请求成功就挂断电话，此时关闭通知窗口先于打开调用， 导致通知窗口没有正确关闭
    // 当前通知弹窗展示的号码的展示状态: 解决还未展示通知就关闭通知的问题
    const callState = useRef(new Map<string, boolean>())

    const getContactByCallNum = (callNum: string) => {
        const params = {
            $filter: `mobilePhone eq '${callNum}' or homePhone eq '${callNum}' or businessPhone eq '${callNum}' or faxPhone eq '${callNum}'`
        }
        const payload = {
            params,
            loginInfo: userConfig.loginInfo,
        }
        console.log('getContactByCallNum', payload);
        return getContact(payload)
    }

    /**
     * 记录通话
     */
    const uploadCallInfo = useCallback((callNum, callStartTimeStamp, callEndTimeStamp, callDirection: string) => {
        if (!userConfig.uploadCall) {
            return
        }
        getContactByCallNum(callNum).then(contactInfo => {
            if (!contactInfo?.id) {
                return
            }

            const duration = callEndTimeStamp - callStartTimeStamp;

            callEndTimeStamp = callEndTimeStamp || new Date().getTime();

            callStartTimeStamp = callStartTimeStamp || new Date().getTime();

            const descriptionParams: CALL_CONFIG_VARIABLES = {
                Agent: waveUserInfo.current.userName,
                AgentEmail: waveUserInfo.current.email,
                AgentFirstName: waveUserInfo.current.firstName,
                AgentLastName: waveUserInfo.current.lastName,
                CallDirection: callDirection,
                CallEndTimeLocal: moment(callEndTimeStamp).toLocaleString(),
                CallEndTimeUTC: moment(callEndTimeStamp).utc().format(),
                CallEndTimeUTCMillis: callEndTimeStamp,
                CallEstablishedTimeUTCMillis: callStartTimeStamp,
                CallEstablishedTimeLocal: moment(callStartTimeStamp).toLocaleString(),
                CallEstablishedTimeUTC: moment(callStartTimeStamp).utc().format(),
                CallStartTimeLocal: moment(callStartTimeStamp).toLocaleString(),
                CallStartTimeUTC: moment(callStartTimeStamp).utc().format(),
                CallStartTimeUTCMillis: callStartTimeStamp,
                CallType: callDirection,
                DateTime: moment(callStartTimeStamp).format(),
                Duration: moment().startOf('day').add(duration, 'ms').format(DATE_FORMAT.format_4),
                EntityId: contactInfo.id,
                EntityType: 'Contacts',
                Name: contactInfo.fullName,
                Number: callNum
            }

            const configDescription = get(userConfig, ['uploadCallConfig', callDirection])

            const params = {
                activityTypeId: 0,
                activityTypeName: 'Call',
                subject: formatDescription(userConfig.uploadCallConfig.subject, descriptionParams),
                contacts: [{
                    id: contactInfo.id,
                    displayName: contactInfo.fullName
                }],
                startTime: moment(callStartTimeStamp).format(DATE_FORMAT.format_2),
                endTime: moment(callEndTimeStamp).format(DATE_FORMAT.format_2),
                details: formatDescription(configDescription, descriptionParams),
                scheduledById: user.id,
            }
            putInteraction(params)
        })
    }, [userConfig, user])

    /**
     * 调用接口根据号码查询联系人信息
     * 调用wave接口，打开通知窗口，展示信息
     * @param callNum 号码
     */
    const initCallInfo = useCallback((callNum: string, unCallAction: boolean, callContactInfo: any, direction: string) => {
        getContactByCallNum(callNum).then(contact => {

            // 是Wave联系人，但不是CRM联系人，不展示信息
            if (!contact.id && callContactInfo) {
                return
            }

            // 需要创建联系人的通话类型
            const createContactBoolean = userConfig.autoCreateConfig.direction === direction || userConfig.autoCreateConfig.direction === 'All'

            // 不是Wave联系人，也不是CRM联系人 且配置自动创建联系人
            if (!contact.id && !callContactInfo && userConfig.autoCreate && createContactBoolean) {
                createNewContact(userConfig, callNum, unCallAction);
                return
            }

            notification(contact, callNum, unCallAction);

        })
    }, [userConfig])

    /**
     * 非Wave联系人 非CRM联系人 创建新的联系人至CRM
     */
    const createNewContact = (userConfig: LooseObject, callNum: string, unCallAction: boolean) => {
        const userInfoParams = {
            Agent: waveUserInfo.current.userName,
            AgentEmail: waveUserInfo.current.email,
            AgentFirstName: waveUserInfo.current.firstName,
            AgentLastName: waveUserInfo.current.lastName,
            Number: callNum
        }

        const params = {
            isUser: true,
            firstName: formatDescription(userConfig.autoCreateConfig.firstName, userInfoParams),
            lastName: formatDescription(userConfig.autoCreateConfig.lastName, userInfoParams),
            businessPhone: callNum,
        }

        createContact(params).then(contact => {
            contact.displayNotification = true;
            notification(contact, callNum, unCallAction);
        })
    }

    const notification = (contact: any, callNum: string, unCallAction: boolean) => {
        console.log('notification', contact, callNum, unCallAction);
        // 展示联系人信息时，不受配置影响
        if (!contact?.displayNotification || !unCallAction && (!callState.current.get(callNum) || !userConfig.notification)) {
            return;
        }
        callNumber.current = callNum;
        const pluginPath = sessionStorage.getItem('pluginPath')

        // body对象，
        const body: any = {
            logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/ACT.svg" alt=""/> ACT! CRM</div>`,
        }

        // 根据自定义信息，添加body属性
        if (contact?.id) {
            // 将showConfig重复的删除
            const configList = [...new Set(Object.values(userConfig.notificationConfig))]
            console.log(configList);
            for (const key in configList) {
                console.log(configList[key])
                if (!configList[key]) {
                    continue;
                }

                // 取出联系人的信息用于展示
                let configValue = getValueByConfig(contact, configList[key]);
                console.log(configValue);
                if (configList[key] === 'Phone') {
                    const phone = formatPhoneNumber(callNum);
                    configValue = phone;
                }
                if (configValue) {
                    body[`config_${key}`] = `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${configValue}</div>`
                }
            }
        }
        else {
            body.phone= `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${formatPhoneNumber(callNum)}</div>`
        }
        body.action = `<div style="margin-top: 10px;display: flex;justify-content: flex-end;"><button style="background: none; border: none;">
        <a href=${ACT_CRM_URL} target="_blank" style="color: #62B0FF">
            ${contact?.id ? formatMessage({ id: 'home.detail' }) : formatMessage({ id: 'home.edit' })}
        </a>
    </button></div>`;

        console.log('displayNotification')
        //@ts-ignore
        pluginSDK.displayNotification({
            notificationBody: getNotificationBody(body),
        })
    }

    useEffect(() => {
        /**
         * 监听号码
         * 回调函数参数：callType,callNum
         **/
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.onViewCustomerInfos, function ({ phoneNumber }) {
            console.log("onViewCustomerInfos", phoneNumber);
            initCallInfo(phoneNumber, true, undefined, '');
        });

        /**
         * 监听收到语音/视频来电
         * 回调函数参数：callType,callNum
         **/
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.recvP2PIncomingCall,
            function ({ callType, callNum, callContactInfo }: any) {
                console.log("onRecvP2PIncomingCall", callType, callNum, callContactInfo);
                callState.current.set(callNum, true);
                initCallInfo(callNum, false, callContactInfo, 'Inbound');
            });

        /**
         * 监听wave发起语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.initP2PCall,
            function ({ callType, callNum, callContactInfo }: any) {
                console.log("onInitP2PCall", callType, callNum, callContactInfo);
                callState.current.set(callNum, true);
                initCallInfo(callNum, false, callContactInfo, 'Outbound');
            });

        return function cleanup() {
            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.onViewCustomerInfos);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.recvP2PIncomingCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.initP2PCall);
        }
    }, [initCallInfo])

    useEffect(() => {
        /**
         * 监听拒绝语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.rejectP2PCall,
            function ({ callType, callNum }: any) {
                console.log("onRejectP2PCall", callType, callNum);
                uploadCallInfo(callNum, 0, 0, WAVE_CALL_TYPE.in);
                console.log("hideNotification, callNum, callState", callNum, callState);
                callState.current.set(callNum, false);
                if (callNumber.current === callNum) {
                    // @ts-ignore
                    pluginSDK.hideNotification();
                }
            });

        /**
         * 监听挂断语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.hangupP2PCall, function (data) {
            console.log("onHangupP2PCall", data);
            let { callNum, callStartTimeStamp, callEndTimeStamp, callDirection } = data;
            callDirection = callDirection === "in" ? WAVE_CALL_TYPE.in : WAVE_CALL_TYPE.out;
            uploadCallInfo(callNum, callStartTimeStamp ?? 0, callEndTimeStamp ?? 0, callDirection);
            console.log("hideNotification, callNum, callState", callNum, callState);
            callState.current.set(callNum, false);
            if (callNumber.current === callNum) {

                // @ts-ignore
                pluginSDK.hideNotification();
            }
        });

        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.p2PCallCanceled,
            function ({ callType, callNum }: any) {
                console.log("p2PCallCanceled", callType, callNum);
                uploadCallInfo(callNum, 0, 0, WAVE_CALL_TYPE.miss);
                console.log("hideNotification, callNum, callState", callNum, callState);
                callState.current.set(callNum, false);
                if (callNumber.current === callNum) {
                    // @ts-ignore
                    pluginSDK.hideNotification();
                }
            });

        return function cleanup() {
            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.rejectP2PCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.hangupP2PCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.p2PCallCanceled);

        };

    }, [uploadCallInfo]);

    useEffect(() => {
        return function closeNotification() {
            // @ts-ignore
            pluginSDK.hideNotification();
        }
    }, [])

    useEffect(() => {
        // @ts-ignore
        pluginSDK.contact.getMe(({ data }) => {
            console.log('getMe', data);
            if (!data) {
                return
            }
            waveUserInfo.current = data;
        })
    }, [])

    return (<></>)
}

export default connect(({ global }: { global: GlobalModelState }) => ({
    userConfig: global.userConfig,
    user: global.user
}), (dispatch: Dispatch) => ({
    getContact: (payload: any) => dispatch({
        type: 'home/getContact', payload,
    }),
    createContact: (payload: any) => dispatch({
        type: 'home/createContact', payload,
    }),
    putInteraction: (payload: any) => dispatch({
        type: 'home/putInteraction', payload,
    }),
}))(IndexPage);