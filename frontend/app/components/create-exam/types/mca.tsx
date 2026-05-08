import { useFieldArray, useFormContext } from "react-hook-form";

export default function MCA({ index }: any) {
    const { register, control } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${index}.options`
    });

    return (
        <div>
            <div className="bg-blue-50 p-3 rounded mb-3 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-blue-900 font-sans">✓ Check all correct answers:</p>
            </div>
            {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2 mt-2 items-center">
                    <input 
                        type="checkbox"
                        {...register(`questions.${index}.options.${i}.isCorrect`)}
                        className="w-4 h-4 cursor-pointer"
                    />

                    <input
                        {...register(`questions.${index}.options.${i}.text`)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 border px-2 py-1"
                    />

                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className="bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-red-700"
                    >
                        X
                    </button>
                </div>
            ))}
            <button
                className="border-2 m-1 p-1 rounded-md hover:bg-gray-100"
                type="button"
                onClick={() => append({ text: "", isCorrect: false })}
            >
                Add Option
            </button>
        </div>
    )
}