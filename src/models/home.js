import { REQUEST_CODE } from "@/constant";
import { createContact, getContact, putInteraction } from '@/services/home';
import { encode } from "js-base64";
import { get } from 'lodash';

export default {
    namespace: 'home', state: {},

    effects: {
        * getContact({ payload }, { call, put }) {
            let res = yield call(getContact, payload.params);
            console.log('getContact res ->', res);
            if (res?.status === REQUEST_CODE.noAuthority) {
                console.log('getContact payload ->', payload);
                const token = encode(payload.loginInfo.username + ':' + payload.loginInfo.password)
                const getToken = yield put({
                    type: 'global/authorize', payload: token,
                })
                yield call(() => getToken);
                res = yield call(getContact, payload.params);
            }
            let connectState = res?.code || 'SUCCESS';
            yield put({
                type: 'global/save', payload: { connectState }
            })
            const contactInfo = get(res, [0]) || {};
            return {
                displayNotification: connectState === 'SUCCESS', ...contactInfo,
            };
        },

        * putInteraction({ payload }, { call, put }) {
            let res = yield call(putInteraction, payload);
            if (res?.status === REQUEST_CODE.noAuthority) {
                const token = encode(payload.loginInfo.username + ':' + payload.loginInfo.password)
                const getToken = yield put({
                    type: 'login/authorize', payload: token,
                })
                yield call(() => getToken);
                res = yield call(putInteraction, payload);
            }
            yield put({
                type: 'global/save',
                payload: { connectState: res?.code || 'SUCCESS', }
            })
            return res;
        },

        * createContact({ payload }, { call, put }) {
            let res = yield call(createContact, payload);
            if (res?.status === REQUEST_CODE.noAuthority) {
                const token = encode(payload.loginInfo.username + ':' + payload.loginInfo.password)
                const getToken = yield put({
                    type: 'login/authorize', payload: token,
                })
                yield call(() => getToken);
                res = yield call(createContact, payload);
            }
            yield put({
                type: 'global/save',
                payload: { connectState: res?.code || 'SUCCESS', }
            })
            return res;
        }

    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload }
        }
    }
}