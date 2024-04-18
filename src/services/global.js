import { BASE_URL } from "@/constant";
import request from '@/utils/request';

export function authorize(params) {
    return request(`${BASE_URL}/authorize`, {
        headers: {
            Authorization: `Basic ${params}`,
        }
    })
}

/**
 * 获取联系人列表
 * @returns
 */
export function getUser() {
    return request(`${BASE_URL}/api/Users`);
}
