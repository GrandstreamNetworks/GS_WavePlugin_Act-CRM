// ACT_CRM 联系人模块url地址
const ACT_CRM_URL = `https://my.act.com`

const ACT_CRM_ADDRESS = {
    US: "https://apius.act.com",
    UK: "https://apiuk.act.com",
    'AUS/NZ': 'https://apiau.act.com',
    EU: 'https://apieu.act.com'
}

// ACT_CRM 开发者密钥
const ACT_DEVELOP_KEY = 'fc4a0aae5fceee3f975bf79f19e54ee4';

const LOGIN_KEYS = ['username', 'password', 'dataBase', 'serverAddress']

/**
 * 全局消息弹窗属性
 * @type {{duration_2: number, duration_1: number, duration_0: number, success: string, warning: string, error: string, duration_5: number, timeout: string, duration_4: number, info: string, duration_3: number}}
 */
const GLOBAL_MESSAGE = {
    timeout: 'global_message_timeout',
    error: 'global_message_error',
    success: 'global_message_success',
    info: 'global_message_info',
    warning: 'global_message_warning',
    duration_0: 0,
    duration_1: 1,
    duration_2: 2,
    duration_3: 3,
    duration_4: 4,
    duration_5: 5,
};

const REQUEST_CODE = {
    ok: 200,
    created: 201,
    deleted: 204,
    dataError: 400,
    noAuthority: 401,
    noFound: 404,
    serverError: 500,
    gatewayError: 502,
    serverOverload: 503,
    serverTimeout: 504,
    connectError: 'CONNECT_ERROR',
    invalidToken: 'INVALID_TOKEN',
    reConnect: 'RECONNECT',
};

/**
 * sessionStorage key
 */
const SESSION_STORAGE_KEY = {
    token: 'token',
    userInfo: 'userInfo',
    serverAddress: 'serverAddress',
    dataBase: 'dataBase',
}

/**
 * 监听wave事件key
 * @type {{recvP2PIncomingCall: string, answerP2PCall: string, rejectP2PCall: string, hangupP2PCall: string}}
 */
const EVENT_KEY = {
    recvP2PIncomingCall: 'onRecvP2PIncomingCall', // 收到来电
    answerP2PCall: 'onAnswerP2PCall', // 接听来电
    hangupP2PCall: 'onHangupP2PCall', // 挂断来电
    rejectP2PCall: 'onRejectP2PCall', // 拒接来电
    initP2PCall: 'onInitP2PCall', // wave发去呼叫
    p2PCallCanceled: 'onP2PCallCanceled', // 未接来电、去电
    initPluginWindowOk: 'onInitPluginWindowOk', //初始化窗口成功
    onViewCustomerInfos: 'onViewCustomerInfos' // 收到客户信息
}

const WAVE_CALL_TYPE = {
    in: 'Inbound',
    out: 'Outbound',
    miss: 'Missed',
}

const DATE_FORMAT = {
    format_1: 'YYYY/MM/DD',
    format_2: 'YYYY-MM-DDTHH:mm:ssZ',
    format_3: 'YYYY/MM/DD HH/mm/ssZ',
    format_4: 'HH:mm:ss',
};

const CONFIG_SHOW = {
    None: undefined,
    Name: ['firstName', 'lastName'],
    Phone: "Phone",
    Email: 'emailAddress',
    Company: 'company',
    Title: 'jobTitle',
}

const NotificationConfig = {
    first: 'Information 1',
    second: 'Information 2',
    third: 'Information 3',
    forth: 'Information 4',
    fifth: 'Information 5'
}

const BASE_URL = '/act.web.api';

const NOTIFICATION_CONFIG_DEF = {
    first: 'Name',
    second: 'Phone',
    third: 'None',
    forth: 'None',
    fifth: 'None',
}

const AUTO_CREATE_CONFIG_DEF = {
    numberType: 'Wave',
    direction: 'All',
    entityType: 'Contact',
    firstName: 'Wave [Number]',
    lastName: 'New',
}

const UPLOAD_CALL_CONFIG_DEF = {
    subject: 'Wave PhoneSystem Call',
    Inbound: '[DateTime]: Incoming call from [Number] [Name] to [Agent]([Duration])',
    Missed: '[DateTime]: Missed call from [Number] [Name] to [Agent]',
    Outbound: '[DateTime]: Outgoing call from [Agent] to [Number] [Name] ([Duration])',
    unansweredOutbound: '[DateTime]: Unanswered outgoing call from [Agent] to [Number] [Name]'
}

const CREATION_CONFIG_CONTACT_TYPE = [
    'Contact'
]

export {
    ACT_CRM_ADDRESS, LOGIN_KEYS, ACT_CRM_URL, ACT_DEVELOP_KEY, AUTO_CREATE_CONFIG_DEF, BASE_URL, CONFIG_SHOW, CREATION_CONFIG_CONTACT_TYPE, DATE_FORMAT, EVENT_KEY, GLOBAL_MESSAGE, NOTIFICATION_CONFIG_DEF, NotificationConfig, REQUEST_CODE,
    SESSION_STORAGE_KEY, UPLOAD_CALL_CONFIG_DEF, WAVE_CALL_TYPE
};

