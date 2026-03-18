"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import OptionItem from "./option-item";

export default function QuestionCard({index, remove}: any) {
    const { register, control } = useFormContext();
    const {fields, append} = useFieldArray({
        control, 
        name: `questions.${index}.options`
    });

    const addOption = () => {
        append({text: "", isCorrect: false});
    };

    return(
        <div className="border rounded-lg p-4">
            <span className="cursor-grab">⋮⋮</span>
            <input 
            {...register(`questions.${index}.text`)}
            placeholder="Question Text"
            />
            <input 
            type="number"
            {...register(`questions.${index}.points`, {valueAsNumber: true})}
            />
            {fields.map((field, i) => (
                <OptionItem
                key={field.id}
                qIndex={index}
                oIndex={i}
                />
            ))}
            <button type="button" onClick={addOption}>
                Add Option
            </button>

            <button type="button" onClick={() => remove(index)}>Delete Question</button>
        </div>
    )
}