/**
 * External dependencies
 *
 * @format
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import page from 'page';
import { identity, noop } from 'lodash';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import Gridicon from 'gridicons';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import viewport from 'lib/viewport';
import { hasUnreadMessages, hasActiveHappychatSession } from 'state/happychat/selectors';
import isHappychatAvailable from 'state/happychat/selectors/is-happychat-available';
import isHappychatConnectionUninitialized from 'state/happychat/selectors/is-happychat-connection-uninitialized';
import getHappychatConfig from 'state/happychat/selectors/get-happychat-config';
import { initConnection } from 'state/happychat/connection/actions';
import { openChat } from 'state/ui/happychat/actions';
import Button from 'components/button';

export class HappychatButton extends Component {
	static propTypes = {
		allowMobileRedirect: PropTypes.bool,
		borderless: PropTypes.bool,
		getConfig: PropTypes.func,
		initConnection: PropTypes.func,
		isChatActive: PropTypes.bool,
		isChatAvailable: PropTypes.bool,
		isConnectionUninitialized: PropTypes.bool,
		onClick: PropTypes.func,
		openChat: PropTypes.func,
		translate: PropTypes.func,
	};

	static defaultProps = {
		allowMobileRedirect: false,
		borderless: true,
		getConfig: noop,
		initConnection: noop,
		isChatActive: false,
		isChatAvailable: false,
		isConnectionUninitialized: false,
		onClick: noop,
		openChat: noop,
		translate: identity,
	};

	onClick = event => {
		if ( this.props.allowMobileRedirect && viewport.isMobile() ) {
			// For mobile clients, happychat will always use the
			// page componet instead of the sidebar
			page( '/me/chat' );
		} else {
			this.props.openChat();
		}

		this.props.onClick( event );
	};

	componentDidMount() {
		// only init connection if it hasn't already initialized
		if ( this.props.isConnectionUninitialized ) {
			this.props.initConnection( this.props.getConfig() );
		}
	}

	render() {
		const {
			translate,
			children,
			className,
			primary,
			borderless,
			hasUnread,
			isChatAvailable,
			isChatActive,
		} = this.props;
		const showButton = isChatAvailable || isChatActive;
		const classes = classnames( 'happychat__button', className, {
			'has-unread': hasUnread,
		} );

		if ( ! showButton ) {
			return null;
		}

		return (
			<Button
				className={ classes }
				primary={ primary }
				borderless={ borderless }
				onClick={ this.onClick }
				title={ translate( 'Support Chat' ) }
			>
				{ children || <Gridicon icon="chat" /> }
			</Button>
		);
	}
}

export default connect(
	state => ( {
		hasUnread: hasUnreadMessages( state ),
		isChatAvailable: isHappychatAvailable( state ),
		isChatActive: hasActiveHappychatSession( state ),
		getConfig: getHappychatConfig( state ),
		isConnectionUninitialized: isHappychatConnectionUninitialized( state ),
	} ),
	{
		openChat,
		initConnection,
	}
)( localize( HappychatButton ) );
