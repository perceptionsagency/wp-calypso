/**
 * External dependencies
 *
 * @format
 */

import { noop } from 'lodash';
import React from 'react';

/**
 * Internal dependencies
 */
import CreditCardForm from 'blocks/credit-card-form';

const createPaygateToken = ( cardDetails, callback ) => callback( null, 'token' );
const saveStoredCard = () => Promise.reject( { message: 'This is an example error.' } );

const CreditCardFormExample = () => {
	const initialValues = {
		name: 'John Doe',
	};

	return (
		<CreditCardForm
			createPaygateToken={ createPaygateToken }
			initialValues={ initialValues }
			recordFormSubmitEvent={ noop }
			saveStoredCard={ saveStoredCard }
			successCallback={ noop }
		/>
	);
};

CreditCardFormExample.displayName = 'CreditCardForm';

export default CreditCardFormExample;
