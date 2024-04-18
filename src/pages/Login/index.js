import DownIcon from '@/asset/login/down.svg'
import { Footer } from '@/components'
import {
    ACT_CRM_ADDRESS,
    AUTO_CREATE_CONFIG_DEF,
    NOTIFICATION_CONFIG_DEF,
    REQUEST_CODE,
    SESSION_STORAGE_KEY,
    UPLOAD_CALL_CONFIG_DEF,
    LOGIN_KEYS,
} from '@/constant'
import { Button, Checkbox, Form, Image, Input } from 'antd'
import { encode } from 'js-base64'
import { useEffect, useRef, useState } from 'react'
import { connect, history, useIntl } from 'umi'
import AccountIcon from '../../asset/login/account-line.svg'
import CodeIcon from '../../asset/login/code-line.svg'
import LockIcon from '../../asset/login/lock-line.svg'
import CloseIcon from '../../asset/login/password-close.svg'
import OpenIcon from '../../asset/login/password-open.svg'
import ServerIcon from '../../asset/login/service-line.svg'
import styles from './index.less'

/**
 * 登录页
 * username: 用户名：需要用户输入API Key
 * password: 密码： 用户的Develop Key
 */
const IndexPage = ({
    getUser, saveUserConfig, authorize, loginLoading = false
}) => {
    const [errorMessage, setErrorMessage] = useState('')
    const [remember, setRemember] = useState(true)
    const [form] = Form.useForm()
    const { formatMessage } = useIntl()
    const userConfig = useRef({})
    const [domainShow, setDomainShow] = useState(false);

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

    const setDomain = (address) => {
        form.setFieldsValue({ serverAddress: address });
        setDomainShow(false)
    };

    const showDomainList = (event) => {
        setDomainShow(true);
        event.stopPropagation();
    };

    /**
     * 跳转home页
     */
    const loginSuccess = (values) => {
        const userConfig = {
            loginInfo: {
                ...values.loginInfo,
                password: remember ? values.loginInfo.password : void 1
            },
            autoLogin: remember,
            uploadCall: values.uploadCall ?? true,
            notification: values.notification ?? true,
            autoCreate: values.autoCreate ?? false,
            autoCreateConfig: values.autoCreateConfig ?? AUTO_CREATE_CONFIG_DEF,
            uploadCallConfig: values.uploadCallConfig ?? UPLOAD_CALL_CONFIG_DEF,
            notificationConfig: values.notificationConfig ?? NOTIFICATION_CONFIG_DEF,
        }
        saveUserConfig(userConfig)
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
    const onFinish = values => {
        let token = encode(values.username + ':' + values.password)
        if (values.autoLogin) {
            sessionStorage.setItem(SESSION_STORAGE_KEY.serverAddress, values.loginInfo.serverAddress)
            sessionStorage.setItem(SESSION_STORAGE_KEY.dataBase, values.loginInfo.dataBase)
            token = encode(values.loginInfo.username + ':' + values.loginInfo.password);
        }
        else {
            sessionStorage.setItem(SESSION_STORAGE_KEY.serverAddress, values.serverAddress)
            sessionStorage.setItem(SESSION_STORAGE_KEY.dataBase, values.dataBase)
        }
        authorize(token).then(res => {
            if (res?.code === REQUEST_CODE.connectError) {
                setErrorMessage('error.host')
                return
            }
            if (res?.status === REQUEST_CODE.noAuthority) {
                setErrorMessage('error.message')
                return
            }
            const config = {
                loginInfo: values, ...values,
            }
            getUserInfo(config);
        })
    }

    const getUserInfo = (values) => {
        getUser(values).then(res => {
            if (res.error) {
                return
            }
            loginSuccess({
                ...userConfig.current, ...values,
            })
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
                    userConfig.current = userInfo;
                    form.setFieldsValue(userInfo.loginInfo)

                    // 已登录的与预装配置进行对比
                    let sameConfig = true;

                    // 有预装配置 走预装配置
                    const preParamObjectStr = sessionStorage.getItem('preParamObject');
                    if (preParamObjectStr) {
                        const preParamObject = JSON.parse(sessionStorage.getItem('preParamObject') || '');
                        if (preParamObject) {
                            const formParams = {};
                            Object.keys(preParamObject).forEach((item) => {
                                LOGIN_KEYS.forEach((element) => {
                                    if (item.toLowerCase() === element.toLowerCase()) {
                                        formParams[element] = preParamObject[item];
                                        if (!sameConfig) {
                                            return;
                                        }
                                        sameConfig = preParamObject[item] === userInfo?.loginInfo?.[element];
                                    }
                                });
                            });
                            form.setFieldsValue(formParams);
                        }
                    }
                    if (userInfo.autoLogin && sameConfig) {
                        onFinish(userInfo)
                    }
                }
                else {
                    // 有预装配置 走预装配置
                    const preParamObjectStr = sessionStorage.getItem('preParamObject');
                    if (!preParamObjectStr) {
                        return;
                    }
                    const preParamObject = JSON.parse(preParamObjectStr);
                    const userConfig = { username: '', password: '', dataBase: '', serverAddress: '' }
                    if (preParamObject) {
                        Object.keys(preParamObject).forEach(item => {
                            Object.keys(userConfig).forEach(element => {
                                if (item.toLowerCase() === element.toLowerCase()) {
                                    userConfig[element] = preParamObject[item]
                                }
                            })
                        })
                        form.setFieldsValue(userConfig)
                    }
                    onFinish(userConfig)
                }
            })
        }
        catch (e) {
            console.error(e)
        }
    }, [])

    return (<>
        {errorMessage && <div className={styles.errorDiv}>
            <div
                className={styles.errorMessage}>{formatMessage({ id: errorMessage })}</div>
        </div>}
        <div className={styles.homePage} onClick={() => setDomainShow(false)}>
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
                            required: true,
                            message: formatMessage({ id: 'login.username.error' })
                        }]}>
                        <Input
                            placeholder={formatMessage({ id: 'login.username' })}
                            prefix={<Image src={AccountIcon} preview={false} />}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{
                            required: true,
                            message: formatMessage({ id: 'login.password.error' })
                        }]}>
                        <Input.Password
                            placeholder={formatMessage({ id: 'login.password' })}
                            prefix={<Image src={LockIcon} preview={false} />}
                            iconRender={visible => (visible ? <Image src={OpenIcon} preview={false} /> :
                                <Image src={CloseIcon} preview={false} />)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="dataBase"
                        rules={[{
                            required: true, message: 'Please input DataBase.'
                        }]}>
                        <Input placeholder="DataBase"
                            prefix={<Image src={CodeIcon}
                                preview={false} />}
                        />
                    </Form.Item>
                    <div className={styles.clientId}>
                        <Form.Item
                            name="serverAddress"
                            rules={[{
                                required: true,
                                message: 'Please input Server Address.'
                            }]}
                        >
                            <Input placeholder={"Server Address"}
                                prefix={<Image src={ServerIcon} preview={false} />}
                                suffix={<Image
                                    src={DownIcon}
                                    className={styles.downIcon}
                                    preview={false}
                                    onClick={showDomainList}
                                />}
                            />
                        </Form.Item>
                        <div
                            className={styles.clientIdList}
                            hidden={!domainShow}
                        >
                            <div className={styles.clientIdListContent}>
                                {Object.keys(ACT_CRM_ADDRESS).map((item) => (
                                    <div
                                        key={item}
                                        onClick={() => setDomain(ACT_CRM_ADDRESS[item])}
                                        className={styles.clientIdItem}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <Form.Item>
                    <Button type="primary" htmlType="submit"
                        loading={loginLoading}>
                        {formatMessage({ id: 'login.submit' })}
                    </Button>
                </Form.Item>
                <div className={styles.remember}>
                    <Checkbox checked={remember} onChange={onCheckChange}>
                        {formatMessage({ id: 'login.remember' })}
                    </Checkbox>
                </div>
            </Form>
        </div >
        <Footer
            url="https://documentation.grandstream.com/knowledge-base/wave-crm-add-ins/#overview"
            message={formatMessage({ id: 'login.user.guide' })} />
    </>)
}

export default connect(({ loading }) => ({
    loginLoading: loading.effects['global/getUser']
}), (dispatch) => ({
    getUser: payload => dispatch({
        type: 'global/getUser', payload
    }), authorize: payload => dispatch({
        type: 'global/authorize', payload
    }), saveUserConfig: payload => dispatch({
        type: 'global/saveUserConfig', payload,
    })
}))(IndexPage)
