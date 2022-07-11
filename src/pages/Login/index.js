import React, { useState, useEffect } from 'react'
import { useIntl, history, connect } from 'umi'
import { Form, Input, Button, Checkbox, Image } from 'antd'
import { encode } from 'js-base64'
import { Footer } from '@/components'
import { REQUEST_CODE, SESSION_STORAGE_KEY, ACT_DEVELOP_KEY } from '@/constant'
import AccountIcon from '../../asset/login/account-line.svg'
import styles from './index.less'

/**
 * 登录页
 * username: 用户名：需要用户输入API Key
 * password: 密码： 用户的Develop Key
 */
const IndexPage = ({ getUser, saveUserConfig, save, loginLoading = false }) => {
    const [errorMessage, setErrorMessage] = useState('')
    const [remember, setRemember] = useState(true)
    const [form] = Form.useForm()
    const { formatMessage } = useIntl()

    /**
     * 自动登录状态更改
     * @param e
     */
    const onCheckChange = e => {
        setRemember(e.target.checked)
    }

    /**
     * 清空异常提示信息
     */
    const onfocus = () => {
        setErrorMessage('')
    }

    /**
     * 跳转home页
     */
    const loginSuccess = () => {
        history.replace({ pathname: '/home', })
    }

    /**
     * 表单提交
     * 将{username+:+password}用base64编码赋值给{token}
     * 获取当前用户信息
     * 调用wave接口，保存用户信息
     * 跳转至home页
     * @param values: {username: String, password: String}
     */
    const onFinish = async values => {
        const token = encode(values.username + ':' + ACT_DEVELOP_KEY)
        sessionStorage.setItem(SESSION_STORAGE_KEY.token, token)
        getUser().then(res => {
            if (res?.code === REQUEST_CODE.connectError) {
                setErrorMessage('error.connect')
                return
            }
            if (res?.status === REQUEST_CODE.noAuthority) {
                setErrorMessage('error.userInfo')
                return
            }
            const userConfig = {
                username: remember ? values.username : undefined,
                autoLogin: remember,
                uploadCall: values.uploadCall ?? true,
                showConfig: values.showConfig ?? {
                    first: 'Name', second: 'Phone', third: 'None', forth: 'None', fifth: 'None',
                },
            }
            save({
                uploadCall: values.uploadCall ?? true,
                showConfig: values.showConfig ?? {
                    first: 'Name', second: 'Phone', third: 'None', forth: 'None', fifth: 'None',
                },
            })
            saveUserConfig(userConfig)
            loginSuccess()
        })
    }

    /**
     * 调用wave接口，获取用户信息
     * 调用onFinish方法，自动登录
     */
    useEffect(async () => {
        try {
            pluginSDK.userConfig.getUserConfig(function ({ errorCode, data }) {
                console.log(errorCode, data)
                if (errorCode === 0 && data) {
                    const userInfo = JSON.parse(data)
                    console.log(userInfo)
                    form.setFieldsValue(userInfo)
                    if (userInfo.autoLogin) {
                        onFinish(userInfo)
                    }
                }
            })
        }
        catch (e) {
            console.error(e)
        }
    }, [])

    return (<>
        {errorMessage && <div className={styles.errorDiv}>
            <div className={styles.errorMessage}>{formatMessage({ id: errorMessage })}</div>
        </div>}
        <div className={styles.homePage}>
            <Form
                className={styles.form}
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFocus={onfocus}
            >
                <div className={styles.formContent}>
                    <Form.Item
                        name="username"
                        rules={[{
                            required: true, message: formatMessage({ id: 'login.username.error' })
                        }]}>
                        <Input placeholder={formatMessage({ id: 'login.username' })}
                            prefix={<Image src={AccountIcon} preview={false} />}
                        />
                    </Form.Item>
                </div>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loginLoading}>
                        {formatMessage({ id: 'login.submit' })}
                    </Button>
                </Form.Item>
                <div className={styles.remember}>
                    <Checkbox checked={remember} onChange={onCheckChange}>
                        {formatMessage({ id: 'login.remember' })}
                    </Checkbox>
                </div>
            </Form>
        </div>
        <Footer url="https://documentation.grandstream.com/knowledge-base/wave-crm-add-ins/#overview"
            message={formatMessage({ id: 'login.user.guide' })} />
    </>)
}

export default connect(({ loading }) => ({
    loginLoading: loading.effects['global/getUser']
}), (dispatch) => ({
    getUser: payload => dispatch({
        type: 'global/getUser', payload
    }), saveUserConfig: payload => dispatch({
        type: 'global/saveUserConfig', payload,
    }), save: payload => dispatch({
        type: 'global/save', payload
    })
}))(IndexPage)
