/** @format **/

/**
 * Internal dependencies
 */
import {
	HAPPYCHAT_BLUR,
	HAPPYCHAT_FOCUS,
	HAPPYCHAT_IO_RECEIVE_STATUS,
	HAPPYCHAT_SET_MESSAGE,
} from 'state/action-types';

export const receiveStatus = status => ( {
	type: HAPPYCHAT_IO_RECEIVE_STATUS,
	status,
} );

export const blur = () => ( { type: HAPPYCHAT_BLUR } );
export const focus = () => ( { type: HAPPYCHAT_FOCUS } );

export const setChatMessage = message => ( { type: HAPPYCHAT_SET_MESSAGE, message } );
