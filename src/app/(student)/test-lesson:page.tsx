// src/app/(student)/test-lesson/page.tsx

import { Metadata } from 'next';
import { LessonViewer } from '@/components/lesson/lesson-viewer';
import { HtmlLessonContent } from '@/types/lesson-content';

export const metadata: Metadata = {
  title: 'Test Lesson | FrancoLink',
  description: 'Test the lesson viewer',
};

export default function TestLessonPage() {
  // Mock lesson data
  const mockLesson = {
    id: 'test-lesson-123',
    title: 'Shopping Conversations',
    slug: 'shopping-conversations',
    xp_reward: 50,
    is_premium: false,
    content: {
      type: 'html' as const,
      version: '2.0' as const, 

      htmlContent: '<div>Your HTML content here</div>',
      title: {
        fr: 'Discutez de vos récents achats',
        en: 'Discussing Your Recent Purchases',
        de: 'Über Ihre letzten Einkäufe sprechen',
        es: 'Discutir sus compras recientes',
      },
      subtitle: {
        fr: 'Pratiquez le vocabulaire des achats',
        en: 'Practice shopping vocabulary',
        de: 'Einkaufsvokabular üben',
        es: 'Practicar vocabulario de compras',
      },
      category: 'daily_conversations' as const,
      targetLevel: 'A1' as const,
      estimatedMinutes: 15,
      objectives: [
        {
          fr: 'Pratiquer la discussion sur les achats récents',
          en: 'Practice talking about recent purchases',
          de: 'Über kürzliche Einkäufe sprechen üben',
          es: 'Practicar hablar sobre compras recientes',
        },
        {
          fr: 'Apprendre le vocabulaire lié au shopping',
          en: 'Learn vocabulary related to shopping',
          de: 'Einkaufsvokabular lernen',
          es: 'Aprender vocabulario relacionado con las compras',
        },
        {
          fr: 'Utiliser le passé composé pour décrire des actions',
          en: 'Use past tense to describe actions',
          de: 'Vergangenheitsform verwenden, um Handlungen zu beschreiben',
          es: 'Usar el pasado para describir acciones',
        },
      ],
      availableLanguages: ['fr', 'en', 'de', 'es'] as const,
      sourceLanguage: 'fr' as const,
      
      // Sample PDF URL (using a public PDF for demo)
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pageCount: 3,
      
      pages: [
        {
          pageNumber: 1,
          pageType: 'cover' as const,
          description: {
            fr: 'Page de couverture avec le titre',
            en: 'Cover page with title',
          },
          hasImages: true,
        },
        {
          pageNumber: 2,
          pageType: 'vocabulary' as const,
          description: {
            fr: 'Liste de vocabulaire',
            en: 'Vocabulary list',
          },
          hasVocabulary: true,
          hasImages: true,
        },
        {
          pageNumber: 3,
          pageType: 'exercise' as const,
          description: {
            fr: 'Exercices pratiques',
            en: 'Practice exercises',
          },
          hasExercises: true,
        },
      ],
      
      vocabulary: [
        {
          term: 'faire du shopping',
          translation: {
            en: 'to go shopping',
            de: 'einkaufen gehen',
            es: 'ir de compras',
          },
          pageNumber: 2,
          pronunciation: 'fɛʁ dy ʃɔpiŋ',
          partOfSpeech: 'verb',
        },
        {
          term: 'un achat',
          translation: {
            en: 'a purchase',
            de: 'ein Kauf',
            es: 'una compra',
          },
          pageNumber: 2,
          pronunciation: 'œ̃n‿aʃa',
          partOfSpeech: 'noun',
          gender: 'masculine' as const,
        },
        {
          term: 'cher/chère',
          translation: {
            en: 'expensive',
            de: 'teuer',
            es: 'caro/cara',
          },
          pageNumber: 2,
          pronunciation: 'ʃɛʁ',
          partOfSpeech: 'adjective',
        },
        {
          term: 'bon marché',
          translation: {
            en: 'cheap, inexpensive',
            de: 'günstig',
            es: 'barato',
          },
          pageNumber: 2,
          pronunciation: 'bɔ̃ maʁʃe',
          partOfSpeech: 'adjective',
        },
        {
          term: 'un magasin',
          translation: {
            en: 'a store',
            de: 'ein Geschäft',
            es: 'una tienda',
          },
          pageNumber: 2,
          pronunciation: 'œ̃ magazɛ̃',
          partOfSpeech: 'noun',
          gender: 'masculine' as const,
        },
        {
          term: 'acheter',
          translation: {
            en: 'to buy',
            de: 'kaufen',
            es: 'comprar',
          },
          pageNumber: 2,
          pronunciation: 'aʃte',
          partOfSpeech: 'verb',
        },
      ],
      
      exercises: [
        {
          id: 'ex-1',
          type: 'fill_blank' as const,
          pageNumber: 3,
          question: 'J\'ai _____ un nouveau manteau hier.',
          answer: 'acheté',
        },
        {
          id: 'ex-2',
          type: 'multiple_choice' as const,
          pageNumber: 3,
          question: 'Translate: "The store is expensive"',
          answer: 'Le magasin est cher',
        },
        {
          id: 'ex-3',
          type: 'translation' as const,
          pageNumber: 3,
          question: 'I went shopping yesterday',
          answer: 'Je suis allé(e) faire du shopping hier',
        },
      ],
      
      tutorNotes: {
        overview: {
          fr: 'Cette leçon introduit le vocabulaire du shopping et pratique le passé composé',
          en: 'This lesson introduces shopping vocabulary and practices past tense',
          de: 'Diese Lektion führt Einkaufsvokabular ein und übt die Vergangenheitsform',
          es: 'Esta lección introduce vocabulario de compras y practica el pasado',
        },
        commonMistakes: [
          {
            fr: 'Confusion entre "cher" et "chère" (accord en genre)',
            en: 'Confusion between "cher" and "chère" (gender agreement)',
            de: 'Verwechslung zwischen "cher" und "chère" (Geschlechtsübereinstimmung)',
            es: 'Confusión entre "cher" y "chère" (concordancia de género)',
          },
          {
            fr: 'Oubli de l\'auxiliaire "être" avec "aller"',
            en: 'Forgetting auxiliary "être" with "aller"',
            de: 'Vergessen des Hilfsverbs "être" mit "aller"',
            es: 'Olvidar el auxiliar "être" con "aller"',
          },
        ],
        extensionActivities: [
          {
            fr: 'Demandez aux étudiants de créer un dialogue sur leurs achats récents',
            en: 'Have students create a dialogue about their recent purchases',
            de: 'Lassen Sie Schüler einen Dialog über ihre letzten Einkäufe erstellen',
            es: 'Pida a los estudiantes que creen un diálogo sobre sus compras recientes',
          },
        ],
      },
    } as HtmlLessonContent,
  };

  const mockUser = {
    id: 'test-user-123',
    native_language: 'English',
    total_xp: 150,
  };

  return (
    <LessonViewer
      lesson={mockLesson}
      user={mockUser}
      language="french"
      level="a1"
    />
  );
}
