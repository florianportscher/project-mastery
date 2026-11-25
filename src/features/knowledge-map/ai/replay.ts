import {
  chapterExtractionMessages,
  chapterExtractionSettings,
  type OfferedUnit,
} from "./chapter-extraction";
import {
  exerciseExtractionMessages,
  exerciseExtractionSettings,
  type OfferedExerciseUnit,
} from "./exercise-extraction";
import {
  type GroupingExam,
  type GroupingItem,
  groupingCallSettings,
  groupingMessages,
} from "./exercise-grouping";
import {
  type CheckInput,
  prerequisiteCheckMessages,
  prerequisiteCheckSettings,
} from "./prerequisite-check";
import {
  type OfferedCourse,
  topicTreeMessages,
  topicTreeSettings,
} from "./topic-tree";

type Grouping = {
  exams: GroupingExam[];
  exercises: GroupingItem[];
  solutions: GroupingItem[];
};

/**
 * The build's model calls as the current code makes them, by trace name,
 * from the data an archived call sent: each sends that data as the JSON of
 * its one user message (`pnpm replay`, docs/agents/cases.md). A change to a
 * prompt, a schema or how the data is written into the message shows in a
 * replay; a change to what data is offered does not.
 */
export const MAP_CALL_REPLAYS = {
  "extract-chapter": (data: unknown) => {
    const unit = data as OfferedUnit;
    return {
      ...chapterExtractionSettings(unit),
      messages: chapterExtractionMessages(unit),
    };
  },
  "extract-exercises": (data: unknown) => {
    const part = data as OfferedExerciseUnit;
    return {
      ...exerciseExtractionSettings(part),
      messages: exerciseExtractionMessages(part),
    };
  },
  "group-exercises": (data: unknown) => {
    const { exams, exercises, solutions } = data as Grouping;
    return {
      ...groupingCallSettings(exercises, solutions, exams),
      messages: groupingMessages(exercises, solutions, exams),
    };
  },
  "check-prerequisites": (data: unknown) => {
    const input = data as CheckInput;
    return {
      ...prerequisiteCheckSettings(input),
      messages: prerequisiteCheckMessages(input),
    };
  },
  "topic-tree": (data: unknown) => {
    const course = data as OfferedCourse;
    return {
      ...topicTreeSettings(course),
      messages: topicTreeMessages(course),
    };
  },
};
