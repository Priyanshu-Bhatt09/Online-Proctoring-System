import { useFormContext } from "react-hook-form"

export default function Input({ index }: any) {
    const { register, watch } = useFormContext();

    const text = watch(`questions.${index}.paragraph`);
    const correctAnswer = watch(`questions.${index}.correctAnswer`);
    const wordLimit = 10;
    const wordCount = text ? text.trim().split(/\s+/).length : 0;
    
    return (
        <div className="flex flex-col gap-2">
            <div className="bg-[#fdf7e7] p-3 rounded mb-3 border-l-4 border-[#f7c873]">
                <p className="text-base font-semibold text-[#a67c00]">Instructions for students:</p>
            </div>
            <input
                className="w-full max-w-xl p-2 mx-2 my-2 border border-[#b3b3a8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3b7c5c]"
                {...register(`questions.${index}.paragraph`)}
                placeholder="Student will write a short answer here"
            />
            <p className="mx-2 text-sm text-[#7c766a] font-sans">
                {wordCount}/{wordLimit} words
            </p>

            <div className="bg-[#eafaf1] p-3 rounded my-4 mx-2 border-l-4 border-[#3b7c5c]">
                <p className="text-base font-semibold text-[#217a4a] mb-2">✓ Enter the correct answer:</p>
                <input
                    type="text"
                    className="w-full max-w-xl p-2 border border-[#b3b3a8] rounded-lg bg-white"
                    {...register(`questions.${index}.correctAnswer`)}
                    placeholder="Enter the correct/expected answer..."
                />
                <p className="text-xs text-[#7c766a] mt-1 font-sans">
                    {correctAnswer ? correctAnswer.length : 0} characters
                </p>
            </div>
        </div>
    )
}