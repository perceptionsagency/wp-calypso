/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

/**
 * Internal dependencies
 */
import { Composer } from '../composer';

describe( '<Composer />', () => {
	describe( 'onChange event ', () => {
		// TODO: cover all typing scenarios
		test( 'should call onSendTyping property', () => {
			const onSendTyping = spy();
			const wrapper = shallow( <Composer onSendTyping={ onSendTyping } /> );
			wrapper.find( 'textarea' ).simulate( 'change', { target: { value: 'hey' } } );
			expect( onSendTyping ).to.have.been.called;
		} );
	} );
} );
