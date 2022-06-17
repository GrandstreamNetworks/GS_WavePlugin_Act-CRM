import React, { useEffect, useRef } from 'react';
import { connect, useIntl, history } from 'umi';
import { Row, Col, Button } from 'antd'
import moment from 'moment-timezone';
import { ConnectError, ConnectState, Footer, SwitchBtn } from '@/components';
import { ACT_CRM_URL, DATE_FORMAT, EVENT_KEY} from '@/constant';
import { getNotificationBody } from '@/utils/utils';
import styles from './index.less'

const HomePage = ({ getContact, putInteraction, userConfig, saveUserConfig }) => {
    const { formatMessage } = useIntl();

    const callNumber = useRef(null);

    /**
     * 登出
     */
    const logoutClick = () => {
        const config = JSON.parse(JSON.stringify(userConfig));
        config.autoLogin = false;
        config.username = undefined;
        saveUserConfig(config);
        history.replace({ pathname: '/login' });
    };

    const getContactByCallNum = callNum => {
        callNum = callNum.replace(/\b(0+)/gi, '');
        const params = {
            $filter: `mobilePhone eq ${callNum} or homePhone eq ${callNum} or businessPhone eq ${callNum}`
        }
        return getContact(params);
    }

    /**
     * 记录通话
     */
    const uploadCallInfo = (callNum, callStartTimeStamp, callEndTimeStamp) => {
        if (!userConfig.uploadCall) {
            return;
        }
        callNum = callNum.replace(/\b(0+)/gi, '');
        getContactByCallNum(callNum).then(contactInfo => {
            if (!contactInfo?.id) {
                return;
            }
            const params = {
                type: 'Call',
                subject: `${contactInfo.firstName + contactInfo.lastName}'s calls`,
                contacts: [{
                    id: contactInfo.id, displayName: contactInfo.firstName + contactInfo.lastName
                }],
                startTime: moment(callStartTimeStamp || undefined).format(DATE_FORMAT.format_2) + 'Z',
                endTime: moment(callEndTimeStamp || undefined).format(DATE_FORMAT.format_2) + 'Z',
                phoneNumber: callNum,
                timeZone: moment.tz.guess(),
                isCompleted: true,
            }
            putInteraction(params);
        })
    }

    /**
     * 跳转至ACT CRM系统
     * 如果查询到用户联系人，则跳转到联系人详情
     * 默认跳转到新增联系人页面
     */
    const getUrl = contact => {
        if (contact?.id) {
            return `${ACT_CRM_URL}/${contact.id}`;
        }
        return `${ACT_CRM_URL}/new`;
    }

    /**
     * 调用接口根据号码查询联系人信息
     * 调用wave接口，打开通知窗口，展示信息
     * @param callNum 号码
     */
    const initCallInfo = (callNum) => {
        getContactByCallNum(callNum).then(contact => {
            if (!contact?.displayNotification) {
                return;
            }
            const name = contact?.firstName + contact?.lastName;
            const url = getUrl(contact);
            const pluginPath = sessionStorage.getItem('pluginPath');
            const body = {
                logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/ACT.svg" alt=""/> ACT! CRM</div>`,
                info: name ? `<div style="font-weight: bold; text-overflow: ellipsis; white-space:nowrap; overflow: hidden">${contact.firstName + contact.lastName}</div>` : null,
                PhoneNumber: `<div style="font-weight: bold; text-overflow: ellipsis; white-space:nowrap; overflow: hidden">${callNum}</div>`,
                title: contact?.jobTitle ? `<div style="font-weight: bold; text-overflow: ellipsis; white-space:nowrap; overflow: hidden">${contact?.jobTitle}</div>` : null,
                action: `<div style="margin-top: 10px;display: flex;justify-content: flex-end;"><button style="background: none; border: none;">
                             <a href=${url} target="_blank" style="color: #62B0FF">
                                 ${contact?.id ? formatMessage({ id: 'home.detail' }) : formatMessage({ id: 'home.edit' })}
                             </a>
                         </button></div>`
            }
            console.log('displayNotification');
            pluginSDK.displayNotification({
                notificationBody: getNotificationBody(body),
            })
        })
    }

    useEffect(() => {
        /**
         * 监听收到语音/视频来电
         * 回调函数参数：callType,callNum
         */
        pluginSDK.eventEmitter.on(EVENT_KEY.recvP2PIncomingCall, function ({ callType, callNum }) {
            console.log('onRecvP2PIncomingCall', callType, callNum);
            callNumber.current = callNum
            initCallInfo(callNum);
        })

        /**
         * 监听wave发起语音/视频
         * 回调函数参数：callType,callNum
         */
        pluginSDK.eventEmitter.on(EVENT_KEY.initP2PCall, function ({ callType, callNum }) {
            console.log('onHangupP2PCall', callType, callNum);
            callNumber.current = callNum
            initCallInfo(callNum);
        })

        return function cleanup() {
            pluginSDK.eventEmitter.off(EVENT_KEY.recvP2PIncomingCall);

            pluginSDK.eventEmitter.off(EVENT_KEY.initP2PCall);
        }
    }, [])

    useEffect(() => {
        /**
         * 监听拒绝语音/视频
         * 回调函数参数：callType,callNum
         */
        pluginSDK.eventEmitter.on(EVENT_KEY.rejectP2PCall, function ({ callType, callNum }) {
            console.log('onRejectP2PCall', callType, callNum);
            uploadCallInfo(callNum, 0, 0);
            if (callNumber.current === callNum) {
                setTimeout(() => {
                    // @ts-ignore
                    pluginSDK.hideNotification();
                }, 1000)
            }
        })

        /**
         * 监听挂断语音/视频
         * 回调函数参数：callType,callNum
         */
        pluginSDK.eventEmitter.on(EVENT_KEY.hangupP2PCall, function (data) {
            console.log('onHangupP2PCall', data);
            let { callNum, callStartTimeStamp, callEndTimeStamp} = data
            uploadCallInfo(callNum, callStartTimeStamp ?? 0, callEndTimeStamp ?? 0);
            if (callNumber.current === callNum) {
                setTimeout(() => {
                    // @ts-ignore
                    pluginSDK.hideNotification();
                }, 1000)
            }
        })

        pluginSDK.eventEmitter.on(EVENT_KEY.p2PCallCanceled, function ({ callType, callNum }) {
            console.log('p2PCallCanceled', callType, callNum);
            uploadCallInfo(callNum, 0, 0);
            if (callNumber.current === callNum) {
                setTimeout(() => {
                    // @ts-ignore
                    pluginSDK.hideNotification();
                }, 1000)
            }
        })

        return function cleanup() {
            pluginSDK.eventEmitter.off(EVENT_KEY.rejectP2PCall);

            pluginSDK.eventEmitter.off(EVENT_KEY.hangupP2PCall);

            pluginSDK.eventEmitter.off(EVENT_KEY.p2PCallCanceled);
        }

    }, [userConfig])

    return (
        <>
            <ConnectError />
            <div className={styles.homePage}>
                <ConnectState />
                <div className={styles.callConfig}>
                    <Row>
                        <Col span={19}>
                            <span className={styles.spanLabel}>{formatMessage({ id: 'home.Synchronize' })}</span>
                        </Col>
                        <Col span={4}>
                            <SwitchBtn />
                        </Col>
                    </Row>
                </div>
                <Button onClick={logoutClick}>{formatMessage({ id: 'home.logout' })}</Button>
            </div>
            <Footer url="https://app.act365.com" message={formatMessage({ id: 'home.toCRM ' })} />
        </>
    )
}

export default connect(({ global }) => ({
    userConfig: global.userConfig, user: global.user, connectState: global.connectState
}), (dispatch) => ({
    getContact: payload => dispatch({
        type: 'home/getContact', payload,
    }),
    putInteraction: payload => dispatch({
        type: 'home/putInteraction', payload,
    }),
    saveUserConfig: payload => dispatch({
        type: 'global/saveUserConfig', payload,
    }),
    save: payload => dispatch({
        type: 'global/save', payload,
    }),
    getUser: payload => dispatch({
        type: 'global/getUser', payload
    }),
}))(HomePage);