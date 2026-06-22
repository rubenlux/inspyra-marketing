export interface QualificationSignals {
  hasWebsite:     boolean;
  hasInstagram:   boolean | null; // null = no website disponible para verificar
  hasFacebook:    boolean | null;
  hasLinkedIn:    boolean | null;
  hasWhatsapp:    boolean | null;
  hasEcommerce:   boolean | null;
  hasAgenda:      boolean | null;
  hasContactForm: boolean | null;
  hasGBP:         boolean;
  sourceChecked:  'website' | 'no_website';
}
