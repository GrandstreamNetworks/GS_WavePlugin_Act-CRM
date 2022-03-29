import request from '../utils/request';

/**
 * 获取联系人列表
 * @returns
 */
export function getUser() {
    return request(`https://app.act365.com/act/api/UserInfos`);
}
