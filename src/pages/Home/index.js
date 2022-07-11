import React, { useCallback } from 'react'
import { connect, useIntl } from 'umi'
import moment from 'moment-timezone'
import { CallAction, ConfigBlock, ConnectError, ConnectState, Footer } from '@/components'
import { ACT_CRM_URL, DATE_FORMAT } from '@/constant'
import { getNotificationBody, getValueByConfig } from '@/utils/utils'
import styles from './index.less'

const HomePage = ({ getContact, putInteraction, showConfig, uploadCall }) => {
    const { formatMessage } = useIntl()

    const getContactByCallNum = callNum => {
        callNum = callNum.replace(/\b(0+)/gi, '')
        const params = {
            $filter: `mobilePhone eq ${callNum} or homePhone eq ${callNum} or businessPhone eq ${callNum}`
        }
        return getContact(params)
    }

    /**
     * 记录通话
     */
    const uploadCallInfo = useCallback((callNum, callStartTimeStamp, callEndTimeStamp) => {
        if (!uploadCall) {
            return
        }
        callNum = callNum.replace(/\b(0+)/gi, '')
        getContactByCallNum(callNum).then(contactInfo => {
            if (!contactInfo?.id) {
                return
            }
            const params = {
                type: 'Call',
                subject: `${contactInfo.firstName ?? ''} ${contactInfo.lastName ?? ''}'s calls`,
                contacts: [{
                    id: contactInfo.id, displayName: `${contactInfo.firstName ?? ''} ${contactInfo.lastName ?? ''}`
                }],
                startTime: moment(callStartTimeStamp || undefined).format(DATE_FORMAT.format_2) + 'Z',
                endTime: moment(callEndTimeStamp || undefined).format(DATE_FORMAT.format_2) + 'Z',
                phoneNumber: callNum,
                timeZone: moment.tz.guess(),
                isCompleted: true,
            }
            putInteraction(params)
        })
    }, [uploadCall])

    /**
     * 跳转至ACT CRM系统
     * 如果查询到用户联系人，则跳转到联系人详情
     * 默认跳转到新增联系人页面
     */
    const getUrl = contact => {
        if (contact?.id) {
            return `${ACT_CRM_URL}/${contact.id}`
        }
        return `${ACT_CRM_URL}/new`
    }

    /**
     * 调用接口根据号码查询联系人信息
     * 调用wave接口，打开通知窗口，展示信息
     * @param callNum 号码
     */
    const initCallInfo = useCallback((callNum) => {
        getContactByCallNum(callNum).then(contact => {
            if (!contact?.displayNotification) {
                return
            }
            const url = getUrl(contact)
            const pluginPath = sessionStorage.getItem('pluginPath')

            // body对象，
            const body = {
                logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/ACT.svg" alt=""/> ACT! CRM</div>`,
            }

            // 根据自定义信息，添加body属性
            if (contact?.id) {
                // 将showConfig重复的删除
                const configList = [...new Set(Object.values(showConfig))]
                console.log(configList)
                for (const key in configList) {
                    console.log(configList[key])
                    if (!configList[key]) {
                        continue
                    }

                    // 取出联系人的信息用于展示
                    const configValue = getValueByConfig(contact, configList[key])
                    console.log(configValue)
                    if (configList[key] === 'Phone') {
                        Object.defineProperty(body, `config_${key}`, {
                            value: `<div style="font-weight: bold">${callNum}</div>`,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        })
                    }
                    else if (configValue) {
                        Object.defineProperty(body, `config_${key}`, {
                            value: `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;">${configValue}</div>`,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        })
                    }
                }
            }
            else {
                Object.defineProperty(body, 'phone', {
                    value: `<div style="font-weight: bold;">${callNum}</div>`,
                    writable: true,
                    enumerable: true,
                    configurable: true
                })
            }

            Object.defineProperty(body, 'action', {
                value: `<div style="margin-top: 10px;display: flex;justify-content: flex-end;"><button style="background: none; border: none;">
                             <a href=${url} target="_blank" style="color: #62B0FF">
                                 ${contact?.id ? formatMessage({ id: 'home.detail' }) : formatMessage({ id: 'home.edit' })}
                             </a>
                         </button></div>`, writable: true, enumerable: true, configurable: true
            })

            console.log('displayNotification')
            pluginSDK.displayNotification({
                notificationBody: getNotificationBody(body),
            })
        })
    }, [showConfig])

    return (<>
        <CallAction uploadCallInfo={uploadCallInfo} initCallInfo={initCallInfo} />
        <ConnectError />
        <div className={styles.homePage}>
            <ConnectState />
            <ConfigBlock />
        </div>
        <Footer url="https://app.act365.com" message={formatMessage({ id: 'home.toCRM' })} />
    </>)
}

export default connect(
    ({ global }) => ({
        user: global.user,
        connectState: global.connectState,
        uploadCall: global.uploadCall,
        showConfig: global.showConfig,
    }),
    (dispatch) => ({
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
    })
)(HomePage)