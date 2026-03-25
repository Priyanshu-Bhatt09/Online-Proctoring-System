import { useFormContext } from "react-hook-form"

export default function ShortText({index}: any) {
    const {register, watch} = useFormContext();

    const text = watch(`questions.${index}.paragraph`);
    const wordLimit = 50;
    const wordCount = text ? text.trim().split(/\s+/).length : 0;
    return(
        <div>
            <textarea
            className="w-[50vw] p-2 mx-5 my-2 border-2"
            {...register(`questions.${index}.paragraph`)}
            placeholder="Student will type a paragraph answer"
            />
            <p className="mx-5 text-sm">
                {wordCount}/{wordLimit} words
            </p>
        </div>
    )
}