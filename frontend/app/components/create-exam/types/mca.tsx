import { useFieldArray, useFormContext } from "react-hook-form";
import { text } from "stream/consumers";

export default function MCA({index}: any) {
    const {register, control} = useFormContext();

    const {fields, append, remove} = useFieldArray({
        control,
        name: `questions.${index}.options`
    });

    return(
        <div>
            {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2 mt-2">
                    <input type="checkbox"
                    {...register(`questions.${index}.options.${i}.isCorrect`)}
                    />

                    <input 
                    {...register(`questions.${index}.options.${i}.text`)}
                    placeholder={`Option ${i+1}`}
                    />

                    <button
                    type="button"
                    onClick={() => remove(i)}
                    >
                        X
                    </button>
                </div>
            ))}
            <button
            className="border-2 m-1 p-1 rounded-md"
            type="button"
            onClick={() => append({text: "", isCorrect: false})}
            >
                Add Option 
            </button>
            
        </div>
    )
}