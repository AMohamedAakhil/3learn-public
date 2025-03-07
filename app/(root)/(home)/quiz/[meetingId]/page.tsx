'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  Question: string;
  Options: string[];
  Answer: string;
}

interface QuizResponse {
  quiz: {
    Questions: Question[];
  };
}

export default function QuizQuestions({ params }: { params: { meetingId: string } }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchQuizQuestions();
  }, []);

  const fetchQuizQuestions = async () => {
    try {
      const response = await fetch(`https://w5zybg82zh6zka-8010.proxy.runpod.net/class/${params.meetingId}/quiz`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions');
      }
      const data: QuizResponse = await response.json();
      if (!data.quiz?.Questions || data.quiz.Questions.length === 0) {
        throw new Error('No questions found for this quiz');
      }
      setQuestions(data.quiz.Questions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load quiz');
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    if (selectedOption === questions[currentQuestion].Answer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleReturnHome = () => {
    router.push('/quiz');
  };

  if (loading) {
    return (
      <section className="flex size-full flex-col gap-10 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex size-full flex-col gap-10 text-white">
        <div className="flex items-center justify-center">
          <div className="bg-white/10 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={handleReturnHome}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Quiz Gen
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (quizCompleted) {
    return (
      <section className="flex size-full flex-col gap-10 text-white">
        <h1 className="text-3xl font-bold">Quiz Results</h1>
        <div className="bg-white/10 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
          <p className="text-xl mb-6 text-gray-300">
            Your score: {score} out of {questions.length}
          </p>
          <button
            onClick={handleReturnHome}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="flex size-full flex-col gap-10 text-white">
        <h1 className="text-3xl font-bold">Quiz</h1>
        <div className="bg-white/10 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-gray-300 mb-6">This quiz has no questions.</p>
          <button
            onClick={handleReturnHome}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Quiz</h1>
      <div className="bg-white/10 p-8 rounded-lg">
        <div className="mb-4 text-sm text-gray-300">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <h2 className="text-xl font-semibold mb-6">
          {questions[currentQuestion].Question}
        </h2>
        <div className="space-y-4">
          {questions[currentQuestion].Options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionSelect(option)}
              className={`p-4 rounded-md cursor-pointer transition-all ${
                selectedOption === option
                  ? 'bg-blue-600/50 border-2 border-blue-500'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {option}
            </div>
          ))}
        </div>
        <button
          onClick={handleNextQuestion}
          disabled={!selectedOption}
          className={`mt-6 px-6 py-2 rounded-md text-white transition-colors ${
            selectedOption
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-white/10 cursor-not-allowed'
          }`}
        >
          {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </section>
  );
} 