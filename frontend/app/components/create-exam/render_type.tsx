import MCA from "./types/mca";
import MCQ from "./types/mcq";

export function renderQuestionType(type: string, index: number) {
    switch(type) {
        case "MCQ":
            return <MCQ index={index} />;

        case "MCA":
            return <MCA index={index} />;
        default:
            return null;
    }
}