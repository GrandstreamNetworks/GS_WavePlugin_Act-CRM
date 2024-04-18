import { stringify } from 'qs';
import request from '@/utils/request';
import { BASE_URL } from "@/constant";

export function getContact(params) {
    return request(`${BASE_URL}/api/contacts?${stringify(params)}`)
}

export function createContact(params) {
    return request(`${BASE_URL}/api/contacts`, {
        method: 'POST', body: params,
    })
}

export function putInteraction(params) {
    return request(`${BASE_URL}/api/tasks`, {
        method: 'POST', body: params,
    })
}