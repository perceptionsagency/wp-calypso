/**
 * External dependencies
 *
 * @format
 */

import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import config from 'config';
import { initConnection } from 'state/happychat/connection/actions';
import getHappychatConfig from 'state/happychat/selectors/get-happychat-config';
import isHappychatConnectionUninitialized from 'state/happychat/selectors/is-happychat-connection-uninitialized';

class HappychatConnection extends Component {
	componentDidMount() {
		if ( config.isEnabled( 'happychat' ) && this.props.isUninitialized ) {
			this.props.initConnection( this.props.getConfig() );
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isUninitialized: isHappychatConnectionUninitialized( state ),
		getConfig: getHappychatConfig( state ),
	} ),
	{ initConnection }
)( HappychatConnection );
