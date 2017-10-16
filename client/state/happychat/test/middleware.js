/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import { stub } from 'sinon';

/**
 * Internal dependencies
 */
import {
	requestTranscript,
	sendActionLogsAndEvents,
	sendAnalyticsLogEvent,
	sendRouteSetEventMessage,
	updateChatPreferences,
} from '../middleware';
import {
	HAPPYCHAT_CHAT_STATUS_ASSIGNED,
	HAPPYCHAT_CHAT_STATUS_DEFAULT,
	HAPPYCHAT_CHAT_STATUS_PENDING,
} from '../selectors';
import {
	HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED,
	HAPPYCHAT_CONNECTION_STATUS_CONNECTED,
} from 'state/happychat/constants';
import {
	ANALYTICS_EVENT_RECORD,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE,
} from 'state/action-types';
import { useSandbox } from 'test/helpers/use-sinon';

describe( 'middleware', () => {
	describe( 'HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE action', () => {
		test( 'should fetch transcript from connection and dispatch receive action', () => {
			const state = deepFreeze( {
				happychat: {
					timeline: [],
				},
			} );
			const response = {
				messages: [ { text: 'hello' } ],
				timestamp: 100000,
			};

			const connection = { transcript: stub().returns( Promise.resolve( response ) ) };
			const dispatch = stub();
			const getState = stub().returns( state );

			return requestTranscript( connection, { getState, dispatch } ).then( () => {
				expect( connection.transcript ).to.have.been.called;

				expect( dispatch ).to.have.been.calledWith( {
					type: HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE,
					...response,
				} );
			} );
		} );
	} );

	describe( 'HELP_CONTACT_FORM_SITE_SELECT action', () => {
		test( 'should send the locale and groups through the connection and send a preferences signal', () => {
			const state = {
				happychat: {
					connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				},
				currentUser: {
					locale: 'en',
					capabilities: {},
				},
				sites: {
					items: {
						1: { ID: 1 },
					},
				},
				ui: {
					section: {
						name: 'reader',
					},
				},
			};
			const getState = () => state;
			const connection = {
				setPreferences: stub(),
			};
			updateChatPreferences( connection, { getState }, 1 );
			expect( connection.setPreferences ).to.have.been.called;
		} );

		test( 'should not send the locale and groups if there is no happychat connection', () => {
			const state = {
				currentUser: {
					locale: 'en',
					capabilities: {},
				},
				sites: {
					items: {
						1: { ID: 1 },
					},
				},
			};
			const getState = () => state;
			const connection = {
				setPreferences: stub(),
			};
			updateChatPreferences( connection, { getState }, 1 );
			expect( connection.setPreferences ).to.have.not.been.called;
		} );
	} );

	describe( 'ROUTE_SET action', () => {
		let connection;
		const action = { path: '/me' };
		const state = {
			currentUser: {
				id: '2',
			},
			users: {
				items: {
					2: { username: 'Link' },
				},
			},
			happychat: {
				connection: {
					status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED,
					isAvailable: true,
				},
				chatStatus: HAPPYCHAT_CHAT_STATUS_ASSIGNED,
			},
		};

		beforeEach( () => {
			connection = { sendEvent: stub() };
		} );

		test( 'should sent the page URL the user is in', () => {
			const getState = () => state;
			sendRouteSetEventMessage( connection, { getState }, action );
			expect( connection.sendEvent ).to.have.been.calledWith(
				'Looking at https://wordpress.com/me?support_user=Link'
			);
		} );

		test( 'should not sent the page URL the user is in when client not connected', () => {
			const getState = () =>
				Object.assign( {}, state, {
					happychat: { connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED } },
				} );
			sendRouteSetEventMessage( connection, { getState }, action );
			expect( connection.sendEvent ).to.not.have.been.called;
		} );

		test( 'should not sent the page URL the user is in when chat is not assigned', () => {
			const getState = () =>
				Object.assign( {}, state, {
					happychat: { chatStatus: HAPPYCHAT_CHAT_STATUS_PENDING },
				} );
			sendRouteSetEventMessage( connection, { getState }, action );
			expect( connection.sendEvent ).to.not.have.been.called;
		} );
	} );

	describe( '#sendAnalyticsLogEvent', () => {
		let connection;

		useSandbox( sandbox => {
			connection = {
				sendLog: sandbox.stub(),
				sendEvent: sandbox.stub(),
			};
		} );

		test( 'should ignore non-tracks analytics recordings', () => {
			const analyticsMeta = [
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'ga' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'fb' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'adwords' } },
			];
			sendAnalyticsLogEvent( connection, { meta: { analytics: analyticsMeta } } );

			expect( connection.sendLog ).not.to.have.been.called;
			expect( connection.sendEvent ).not.to.have.been.called;
		} );

		test( 'should send log events for all listed tracks events', () => {
			const analyticsMeta = [
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'ga' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'adwords' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
			];
			sendAnalyticsLogEvent( connection, { meta: { analytics: analyticsMeta } } );

			expect( connection.sendLog.callCount ).to.equal( 2 );
			expect( connection.sendLog ).to.have.been.calledWith( 'abc' );
			expect( connection.sendLog ).to.have.been.calledWith( 'def' );
		} );

		test( 'should only send a timeline event for whitelisted tracks events', () => {
			const analyticsMeta = [
				{
					type: ANALYTICS_EVENT_RECORD,
					payload: { service: 'tracks', name: 'calypso_add_new_wordpress_click' },
				},
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
				{
					type: ANALYTICS_EVENT_RECORD,
					payload: {
						service: 'tracks',
						name: 'calypso_themeshowcase_theme_activate',
						properties: {},
					},
				},
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
			];
			sendAnalyticsLogEvent( connection, { meta: { analytics: analyticsMeta } } );

			expect( connection.sendEvent.callCount ).to.equal( 2 );
		} );
	} );

	describe( '#sendActionLogsAndEvents', () => {
		const assignedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				chatStatus: HAPPYCHAT_CHAT_STATUS_ASSIGNED,
			},
		} );
		const unassignedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				chatStatus: HAPPYCHAT_CHAT_STATUS_DEFAULT,
			},
		} );
		const unconnectedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED },
				chatStatus: HAPPYCHAT_CHAT_STATUS_DEFAULT,
			},
		} );

		let connection, getState;

		useSandbox( sandbox => {
			connection = {
				sendLog: sandbox.stub(),
				sendEvent: sandbox.stub(),
			};

			getState = sandbox.stub();
		} );

		beforeEach( () => {
			getState.returns( assignedState );
		} );

		test( "should not send events if there's no Happychat connection", () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
					],
				},
			};
			getState.returns( unconnectedState );
			sendActionLogsAndEvents( connection, { getState }, action );

			expect( connection.sendLog ).not.to.have.been.called;
			expect( connection.sendEvent ).not.to.have.been.called;
		} );

		test( 'should not send log events if the Happychat connection is unassigned', () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
					],
				},
			};
			getState.returns( unassignedState );
			sendActionLogsAndEvents( connection, { getState }, action );

			expect( connection.sendLog ).not.to.have.been.called;
			expect( connection.sendEvent ).not.to.have.been.called;
		} );

		test( 'should send matching events when Happychat is connected and assigned', () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{
							type: ANALYTICS_EVENT_RECORD,
							payload: { service: 'tracks', name: 'calypso_add_new_wordpress_click' },
						},
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
						{
							type: ANALYTICS_EVENT_RECORD,
							payload: {
								service: 'tracks',
								name: 'calypso_themeshowcase_theme_activate',
								properties: {},
							},
						},
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
					],
				},
			};
			getState.returns( assignedState );
			sendActionLogsAndEvents( connection, { getState }, action );

			// All 4 analytics records will be sent to the "firehose" log
			expect( connection.sendLog.callCount ).to.equal( 4 );
			// The two whitelisted analytics events and the HAPPYCHAT_BLUR action itself
			// will be sent as customer events
			expect( connection.sendEvent.callCount ).to.equal( 3 );
		} );
	} );
} );
