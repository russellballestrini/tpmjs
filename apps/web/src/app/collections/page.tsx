import { redirect } from 'next/navigation';

/**
 * DEPRECATED: The /collections list page is deprecated.
 * Users should browse collections through user profiles.
 * All requests are 301 redirected to the homepage.
 */
export default function CollectionsListRedirectPage() {
  redirect('/');
}
