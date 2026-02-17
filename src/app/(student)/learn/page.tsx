import Link from "next/link";
import { Card } from "@/components/ui";

const languages = [
  { code: "french", name: "French", flag: "🇫🇷", courses: 3 },
  { code: "spanish", name: "Spanish", flag: "🇪🇸", courses: 2 },
  { code: "english", name: "English", flag: "🇬🇧", courses: 2 },
];

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          Learn a Language
        </h1>
        <p className="text-gray-600 mt-1">
          Choose a language to start or continue learning
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languages.map((lang) => (
          <Link key={lang.code} href={`/learn/${lang.code}`}>
            <Card hover className="text-center">
              <span className="text-6xl mb-4 block">{lang.flag}</span>
              <h2 className="text-xl font-heading font-bold text-primary mb-2">
                {lang.name}
              </h2>
              <p className="text-gray-500">{lang.courses} courses available</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}