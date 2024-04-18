import {
    ConfigBlock,
    ConnectError,
    ConnectState,
    Footer
} from '@/components'
import { connect, useIntl } from 'umi'
import styles from './index.less'

const HomePage = ({ userConfig }) => {
    const { formatMessage } = useIntl()

    return (<>
        <ConnectError />
        <div className={styles.homePage}>
            <ConnectState />
            <ConfigBlock />
        </div>
        <Footer url="https://www.act.com/"
            userConfig={userConfig}
            message={formatMessage({ id: 'home.toCRM' })} />
    </>)
}

export default connect(({ global }) => ({
    userConfig: global.userConfig,
}))(HomePage);