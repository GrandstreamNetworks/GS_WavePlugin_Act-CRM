import { SESSION_STORAGE_KEY } from "@/constant";
import { authorize, getUser } from '@/services/global';
import { get } from 'lodash';
import { Effect, Reducer, history } from 'umi';

export interface GlobalModelState {
    user: LooseObject
    userConfig: LooseObject
    connectState: string
}

export interface GlobalModelType {
    namespace: string
    state: GlobalModelState
    effects: {
        authorize: Effect
        getUser: Effect
        userConfigChange: Effect
        saveUserConfig: Effect
        logout: Effect
    }
    reducers: {
        save: Reducer<GlobalModelState>
    }
}

const globalModel: GlobalModelType = {
    namespace: 'global', state: {
        user: {},
        userConfig: {},
        connectState: 'SUCCESS',
    },

    effects: {
        * authorize({ payload }, { call, put }): any {
            const res = yield call(authorize, payload);
            yield put({
                type: 'save', payload: {
                    connectState: res?.code || 'SUCCESS',
                }
            })
            if (!res.error) {
                sessionStorage.setItem(SESSION_STORAGE_KEY.token, res);
            }
            return res;
        },

        * getUser(_, { call, put }): any {
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

        * userConfigChange({ payload }, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            const newConfig = {
                ...userConfig,
                ...payload,
            }
            yield put({
                type: 'saveUserConfig',
                payload: newConfig,
            })
        },

        * saveUserConfig({ payload }, { put }) {
            console.log(payload);
            //@ts-ignore
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
            const { userConfig } = yield select((state: any) => state.global);
            userConfig.autoLogin = false;
            userConfig.loginInfo && (userConfig.loginInfo.password = undefined);
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

export default globalModel;
