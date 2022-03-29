import { get } from 'lodash';
import { SESSION_STORAGE_KEY } from '@/constant';
import { getUser } from '@/services/global';

export default {
    namespace: 'global', state: {
        user: {}, userConfig: {}, connectState: 'SUCCESS',
    },
    
    effects: {
        * getUser(_, { call, put }) {
            const res = yield call(getUser);
            const user = get(res, [0]) || {};
            sessionStorage.setItem(SESSION_STORAGE_KEY.userInfo, JSON.stringify(user));
            yield put({
                type: 'save', payload: {
                    user, connectState: res?.code || 'SUCCESS',
                }
            })
            return res;
        },
        
        * saveUserConfig({ payload }, { put }) {
            console.log(payload);
            pluginSDK.userConfig.addUserConfig({ userConfig: JSON.stringify(payload) }, function ({ errorCode }) {
                console.log(errorCode);
            })
            yield put({
                type: 'save', payload: {
                    userConfig: payload
                },
            })
        }
    },
    
    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
};
