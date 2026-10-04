/**
 * The SCB demo build (portfolio spec J.3, ADR-0044): `vite build --mode demo`
 * builds the real SCB site for /demo/scb-handyman/ in the portfolio, where it
 * submits nothing (QuotePage's development port) and says so.
 */
export const IS_DEMO = import.meta.env.MODE === 'demo';

export const DEMO_NOTICE = 'Demo of the SCB Handyman site. Nothing you enter is sent anywhere.';
