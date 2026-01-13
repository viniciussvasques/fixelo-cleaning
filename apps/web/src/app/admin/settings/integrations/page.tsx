/**
 * Admin Integrations Settings
 * 
 * Configure Email, Stripe, and Twilio integrations.
 */

import { getIntegrationConfigs } from './actions';
import { IntegrationsForm } from './integrations-form';

export const dynamic = 'force-dynamic';


export default async function IntegrationsPage() {
    const configs = await getIntegrationConfigs();

    return <IntegrationsForm initialConfigs={configs} />;
}
