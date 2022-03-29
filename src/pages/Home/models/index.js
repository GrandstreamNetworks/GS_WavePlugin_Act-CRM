import { get } from 'lodash';
import { getContact, putInteraction } from '../services';

export default {
    namespace: 'home', state: {},
    
    effects: {
        * getContact({ payload }, { call, put }) {
            const res = yield call(getContact, payload);
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
            const res = yield call(putInteraction, payload);
            yield put({
                type: 'global/save', payload: { connectState: res?.code || 'SUCCESS', }
            })
            return res;
        },
        
    },
    
    reducers: {
        save(state, action) {
            return { ...state, ...action.payload }
        }
    }
}