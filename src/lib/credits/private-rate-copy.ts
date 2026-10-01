// Words for the private-rate page, in English and French.
//
// Every fact here is a rule the app enforces, not a marketing line: 12 hours
// is FREE_CANCELLATION_HOURS in /api/booking/cancel, "the day before" is the
// 24h reminder in lib/booking/notify.ts, and half a lesson for 25 minutes is
// the credit cost in lib/booking/confirm.ts. Change one there, change it here.

export type RateLang = "en" | "fr";

export const rateLang = (v: string | undefined): RateLang =>
  v === "fr" ? "fr" : "en";

export interface RateCopy {
  title: string;
  switchTo: string;
  welcome: string;
  welcomeBody: string;
  yearsTeaching: (n: number) => string;
  reviews: (n: number) => string;
  seeProfile: string;
  howTitle: string;
  steps: { title: string; body: string }[];
  roomTitle: string;
  roomBody: string;
  roomPoints: string[];
  priceTitle: string;
  yourTutor: string;
  bookNow: string;
  faqTitle: string;
  faq: (days: number) => { q: string; a: string }[];
  // Price card
  lessons: (n: number) => string;
  aLesson: string;
  youSave: (amount: string) => string;
  lessonLength: (n: number) => string;
  useWithin: (days: number) => string;
  noSubscription: string;
  buy: (n: number) => string;
  createAccount: string;
  redirecting: string;
  haveAccount: string;
  logIn: string;
  checkoutError: string;
}

export const RATE_COPY: Record<RateLang, RateCopy> = {
  en: {
    title: "Your lesson rate",
    switchTo: "Français",
    welcome: "Welcome to FrancoLink",
    welcomeBody:
      "Same teacher, same lessons, same rate. Your lessons now happen on FrancoLink, where you pick your own times and everything for the lesson is in one place.",
    yearsTeaching: (n) => `${n} years teaching`,
    reviews: (n) => `${n} review${n === 1 ? "" : "s"}`,
    seeProfile: "See full profile",
    howTitle: "How it works",
    steps: [
      {
        title: "Create your account",
        body: "Free, and takes a minute. Use any email you like.",
      },
      {
        title: "Buy your 10 lessons",
        body: "One payment by card. No subscription.",
      },
      {
        title: "Pick your times",
        body: "Choose any open slot in your tutor's calendar, whenever suits you. Times are shown in your own timezone.",
      },
      {
        title: "Join from your email",
        body: "You get a confirmation with the link, and a reminder the day before. Click it at lesson time. Nothing to install.",
      },
    ],
    roomTitle: "Where lessons happen",
    roomBody:
      "In FrancoLink's own lesson room, right in your browser. No Zoom, no Skype, no app to download.",
    roomPoints: [
      "Video call built in",
      "The lesson on screen beside the video, for both of you",
      "Your tutor highlights what matters as you go",
    ],
    priceTitle: "Your rate",
    yourTutor: "Your tutor",
    bookNow: "Pick a lesson time",
    faqTitle: "Questions",
    faq: (days) => [
      {
        q: "How long do I have to use my lessons?",
        a: `${days} days from when you buy them. Plan for about two or three lessons a week.`,
      },
      {
        q: "Can I cancel or move a lesson?",
        a: "Yes. Cancel up to 12 hours before and the lesson goes back on your balance to book again. Inside 12 hours, the lesson counts.",
      },
      {
        q: "What do I need?",
        a: "A computer, tablet or phone with a camera and microphone, and an up-to-date browser such as Chrome, Safari, Edge or Firefox.",
      },
      {
        q: "Can I book shorter lessons?",
        a: "Yes. A 25-minute lesson uses half a lesson from your balance, so 10 lessons can also be 20 short ones.",
      },
      {
        q: "What happens when my 10 lessons run out?",
        a: "Come back to this same link and buy the next 10 at the same price.",
      },
    ],
    lessons: (n) => `${n} lessons`,
    aLesson: "a lesson",
    youSave: (amount) => `You save ${amount} on the regular price`,
    lessonLength: (n) => `${n} lessons of 50–60 minutes`,
    useWithin: (days) => `Use them within ${days} days`,
    noSubscription: "No subscription. Buy the next block when you need it",
    buy: (n) => `Buy ${n} lessons`,
    createAccount: "Create an account to buy",
    redirecting: "Taking you to checkout…",
    haveAccount: "Already have an account?",
    logIn: "Log in",
    checkoutError: "Couldn't start checkout.",
  },
  fr: {
    title: "Votre tarif de cours",
    switchTo: "English",
    welcome: "Bienvenue sur FrancoLink",
    welcomeBody:
      "Le même professeur, les mêmes cours, le même tarif. Vos cours ont désormais lieu sur FrancoLink : vous choisissez vos horaires et tout ce qu'il faut pour le cours est au même endroit.",
    yearsTeaching: (n) => `${n} ans d'enseignement`,
    reviews: (n) => `${n} avis`,
    seeProfile: "Voir le profil complet",
    howTitle: "Comment ça marche",
    steps: [
      {
        title: "Créez votre compte",
        body: "Gratuit, en une minute. Avec l'adresse e-mail de votre choix.",
      },
      {
        title: "Achetez vos 10 cours",
        body: "Un seul paiement par carte. Sans abonnement.",
      },
      {
        title: "Choisissez vos horaires",
        body: "Réservez n'importe quel créneau libre dans le calendrier de votre professeur, quand cela vous convient. Les horaires s'affichent dans votre fuseau horaire.",
      },
      {
        title: "Rejoignez le cours depuis votre e-mail",
        body: "Vous recevez une confirmation avec le lien, puis un rappel la veille. Cliquez dessus à l'heure du cours. Rien à installer.",
      },
    ],
    roomTitle: "Où ont lieu les cours",
    roomBody:
      "Dans la salle de cours de FrancoLink, directement dans votre navigateur. Pas de Zoom, pas de Skype, aucune application à télécharger.",
    roomPoints: [
      "Appel vidéo intégré",
      "Le cours à l'écran à côté de la vidéo, pour vous deux",
      "Votre professeur surligne l'essentiel au fil du cours",
    ],
    priceTitle: "Votre tarif",
    yourTutor: "Votre professeur",
    bookNow: "Choisir un horaire",
    faqTitle: "Questions",
    faq: (days) => [
      {
        q: "Combien de temps ai-je pour utiliser mes cours ?",
        a: `${days} jours à partir de l'achat. Prévoyez environ deux ou trois cours par semaine.`,
      },
      {
        q: "Puis-je annuler ou déplacer un cours ?",
        a: "Oui. Annulez jusqu'à 12 heures avant et le cours revient sur votre solde pour être réservé à nouveau. À moins de 12 heures, le cours est dû.",
      },
      {
        q: "De quoi ai-je besoin ?",
        a: "Un ordinateur, une tablette ou un téléphone avec caméra et micro, et un navigateur à jour comme Chrome, Safari, Edge ou Firefox.",
      },
      {
        q: "Puis-je réserver des cours plus courts ?",
        a: "Oui. Un cours de 25 minutes utilise un demi-cours de votre solde : 10 cours peuvent donc devenir 20 cours courts.",
      },
      {
        q: "Que se passe-t-il quand mes 10 cours sont terminés ?",
        a: "Revenez sur ce même lien et achetez les 10 suivants au même prix.",
      },
    ],
    lessons: (n) => `${n} cours`,
    aLesson: "le cours",
    youSave: (amount) => `Vous économisez ${amount} sur le prix normal`,
    lessonLength: (n) => `${n} cours de 50 à 60 minutes`,
    useWithin: (days) => `À utiliser sous ${days} jours`,
    noSubscription:
      "Sans abonnement. Achetez le bloc suivant quand vous en avez besoin",
    buy: (n) => `Acheter ${n} cours`,
    createAccount: "Créer un compte pour acheter",
    redirecting: "Redirection vers le paiement…",
    haveAccount: "Vous avez déjà un compte ?",
    logIn: "Se connecter",
    checkoutError: "Impossible de lancer le paiement.",
  },
};
