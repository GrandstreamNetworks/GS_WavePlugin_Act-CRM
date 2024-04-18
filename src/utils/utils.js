import { CONFIG_SHOW } from '@/constant';
import { get } from 'lodash';
import parsePhoneNumberFromString from 'libphonenumber-js';

export function getNotificationBody(body) {
    let result = `<div style="color: #f0f0f0">`
    for (const property in body) {
        if (body.hasOwnProperty(property)) {
            if (body[property]) {
                result += `${body[property]}`
            }
        }
    }
    result += `</div>`
    return result
}

// 根据CONFIG_SHOW的属性值获取Object的属性值。
export function getValueByConfig(obj, key) {
    if (!key) {
        return null;
    }
    const T_key = get(CONFIG_SHOW, [key]);
    if (Array.isArray(T_key)) {
        let result = null;
        for (const item in T_key) {
            const value = get(obj, T_key[item]);
            if (['string', 'number', 'bigint'].includes(typeof value)) {
                result = result && value ? result + ' ' + value : result || value;
            }
            continue;
        }
        return result;
    }
    return get(obj, T_key);
}

export function formatDescription(str, params) {
    const regex = /\[([a-zA-Z]+)\]/g;
    return str?.replace(regex, (match, capture) => {
        return get(params, capture) || ''
    });
}

export const formatPhoneNumber = (phone) => {
    if (!phone) return phone;
    // 使用 libphonenumber 解析电话号码
    const parsedPhoneNumber = parsePhoneNumberFromString(phone);
    if (parsedPhoneNumber) {
        // 获取格式化后的号码
        return parsedPhoneNumber.formatInternational();
    } else {
        // 如果解析失败，返回原始号码
        return phone;
    }
}