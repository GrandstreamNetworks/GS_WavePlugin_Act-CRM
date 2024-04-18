/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { REQUEST_CODE, SESSION_STORAGE_KEY } from '@/constant';
import { Response, formatMessage } from 'umi';
import { extend } from 'umi-request';

/**
 * 异常处理程序
 */
const errorHandler = (error: any): Response => {
    console.log('errorHandler error ->', error);
    if (error.message === "Failed to fetch") {
        return {
            code: REQUEST_CODE.connectError,
            error: formatMessage({ id: 'error.connect' }),
        }
    }
    const { response } = error;
    console.log('errorHandler response ->', response);
    return {
        code: response?.status === REQUEST_CODE.noAuthority ? REQUEST_CODE.invalidToken : '',
        status: response?.status,
        error: formatMessage({ id: 'error.network' }),
        response,
    };
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
    errorHandler, // 默认错误处理
    credentials: 'include', // 默认请求是否带上cookie
    prefix: '', // constants.REQUEST_PERFIX,
    // requestType: 'json',
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8', // 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    // method: 'post',
    getResponse: false, // 是否获取源 response, 返回结果将包裹一层
});

request.interceptors.request.use((url, options) => {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY.token);
    const database = sessionStorage.getItem(SESSION_STORAGE_KEY.dataBase);
    const serverAddress = sessionStorage.getItem(SESSION_STORAGE_KEY.serverAddress);
    const headers = { ...options.headers };
    return {
        url: serverAddress + url,
        options: {
            ...options,
            body: JSON.stringify(options.body),
            headers: {
                'Authorization': `Bearer ${token}`,
                'content-type': 'application/json; charset=utf-8',
                'Act-Database-Name': `${database}`, ...headers,
            },
        },
    };
});

request.interceptors.response.use((response: Response) => {
    return response;
});

export default request;
