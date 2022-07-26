import { get } from 'lodash';
import { history } from 'umi';
import { getUser } from '@/services/global';

export default {
    namespace: 'global', state: {
        user: {}, userConfig: {}, connectState: 'SUCCESS', uploadCall: true, showConfig: {}, callState: new Map(),
    },

    effects: {
        * getUser(_, { call, put }) {
            const res = yield call(getUser);
            const user = get(res, [0]) || {};
            if (user.id) {
                yield put({
                    type: 'save', payload: {
                        user, connectState: res?.code || 'SUCCESS',
                    }
                })
            }
            else {
                yield put({
                    type: 'save', payload: {
                        connectState: res?.code || 'SUCCESS',
                    }
                })
            }
            return res;
        },

        * uploadCallChange({ payload }, { put, select }) {
            const { userConfig } = yield select((state) => state.global);
            userConfig.uploadCall = payload;
            yield put({
                type: 'saveUserConfig', payload: userConfig,
            })
            yield put({
                type: 'save', payload: {
                    uploadCall: payload,
                }
            })
        },

        * saveShowConfig({ payload }, { put, select }) {
            const { userConfig } = yield select((state) => state.global);
            console.log(userConfig);
            userConfig.showConfig = payload;
            yield put({
                type: 'saveUserConfig', payload: userConfig,
            })
            yield put({
                type: 'save', payload: {
                    showConfig: payload,
                }
            })
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
        },

        * logout(_, { put, select }) {
            const { userConfig } = yield select((state) => state.global);
            userConfig.autoLogin = false;
            userConfig.username = undefined;
            yield put({
                type: 'saveUserConfig', payload: userConfig,
            })
            history.replace({ pathname: '/login' });
        }
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
};
