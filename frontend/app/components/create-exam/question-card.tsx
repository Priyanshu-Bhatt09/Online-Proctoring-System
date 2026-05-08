"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { renderQuestionType } from "./render_type";

type QuestionCardProps = {
    index: number,
    remove: (index: number) => void,
    dragHandleProps: Record<string, unknown>
}

export default function QuestionCard({ index, remove, dragHandleProps }: QuestionCardProps) {
    const { register, watch } = useFormContext(); //watch is used when we want the UI to change based on the form values

    const type = watch(`questions.${index}.type`); //this lets us read the current value of the form field and updates when it changes
    // const { fields, append } = useFieldArray({
    //     control,
    //     name: `questions.${index}.options`
    // });

    // const addOption = () => {
    //     append({ text: "", isCorrect: false });
    // };

    return (
        <div className="flex flex-col gap-4 font-sans">
            <div className="flex flex-wrap gap-6 items-center mb-2">
                <span {...dragHandleProps} className="cursor-grab text-2xl text-[#3b7c5c] mr-2">⋮⋮</span>
                <div className="flex-1 min-w-[220px]">
                    <label className="block font-semibold mb-1">Question Text</label>
                    <input
                        className="border border-[#b3b3a8] rounded-lg px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#3b7c5c]"
                        {...register(`questions.${index}.text`)}
                        placeholder="New question"
                    />
                </div>
                <div className="w-32 min-w-[100px]">
                    <label className="block font-semibold mb-1">Points</label>
                    <input
                        className="border border-[#b3b3a8] rounded-lg px-2 py-1 w-full text-center bg-white"
                        type="number"
                        {...register(`questions.${index}.points`, { valueAsNumber: true })}
                    />
                </div>
                <div className="w-40 min-w-[120px]">
                    <label className="block font-semibold mb-1">Negative Points</label>
                    <input
                        className="border border-[#b3b3a8] rounded-lg px-2 py-1 w-full text-center bg-white"
                        type="number"
                        {...register(`questions.${index}.negativePoint`, { valueAsNumber: true })}
                    />
                </div>
                <div className="w-48 min-w-[140px]">
                    <label className="block font-semibold mb-1">Question Type</label>
                    <select
                        className="border border-[#b3b3a8] rounded-lg px-2 py-2 w-full bg-white"
                        {...register(`questions.${index}.type`)}
                    >
                        <option value="MCQ">MCQ</option>
                        <option value="MCA">MCA</option>
                        <option value="SHORT_TEXT">Short text</option>
                        <option value="CODING">Coding</option>
                        <option value="INPUT">Input</option>
                    </select>
                </div>
            </div>

            <div className="mt-2">
                {renderQuestionType(type, index)}
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    type="button"
                    className="flex-1 py-2 rounded-lg bg-[#3b7c5c] text-white font-semibold shadow hover:bg-[#2e6248] transition-colors border border-[#3b7c5c]"
                    onClick={() => remove(index)}
                >
                    Delete Question
                </button>
            </div>
        </div>
    )
}