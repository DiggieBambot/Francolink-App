export const LANGUAGES = {
  available: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  ],
  comingSoon: [
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  ],
} as const;

// NOTE: there was a STATS constant here holding '5,000+' learners, '120+' tutors
// and '50,000+' lessons delivered. All three were placeholders that no query ever
// produced, and /testimonials states plainly that there are no reviews yet.
// Publishing them was an advertising exposure, not just an SEO problem.
// If real figures are ever wanted here, derive them from the database. Do not
// reintroduce hardcoded ones.