import { stringify } from 'qs';
import request from '@/utils/request';

export function getContact(params) {
    return request(`https://app.act365.com/act/api/contacts?${stringify(params)}`)
}

export function putInteraction(params) {
    return request(`https://app.act365.com/act/api/Interactions`, {
        method: 'POST',
        body: params,
    })
}