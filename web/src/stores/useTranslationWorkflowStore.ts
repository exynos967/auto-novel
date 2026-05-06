import {
  defaultWorkflowProfile,
  type WorkflowProfile,
} from '@/domain/translate/workflow';
import { useSyncedLocalStorage } from '@/util/useStorage/UseSyncedLocalStorage';

import { LSKey } from './key';

export interface TranslationWorkflowState {
  profile: WorkflowProfile;
  currentProjectId: string | null;
  currentProjectType: 'auto' | 'novel' | 'game';
}

export namespace TranslationWorkflowState {
  export const defaultValue = (): TranslationWorkflowState => ({
    profile: defaultWorkflowProfile(),
    currentProjectId: null,
    currentProjectType: 'auto',
  });

  export const migrate = (state: TranslationWorkflowState) => {
    const defaults = defaultValue();
    state.currentProjectId =
      state.currentProjectId ?? defaults.currentProjectId;
    state.currentProjectType =
      state.currentProjectType ?? defaults.currentProjectType;
    const currentProfile = state.profile ?? defaults.profile;
    state.profile = {
      ...defaults.profile,
      ...currentProfile,
      dictionary: {
        ...defaults.profile.dictionary,
        ...(currentProfile.dictionary ?? {}),
      },
      prompts: {
        ...defaults.profile.prompts,
        ...(currentProfile.prompts ?? {}),
        translation: {
          ...defaults.profile.prompts.translation,
          ...(currentProfile.prompts?.translation ?? {}),
        },
        polish: {
          ...defaults.profile.prompts.polish,
          ...(currentProfile.prompts?.polish ?? {}),
        },
      },
      responseChecks: {
        ...defaults.profile.responseChecks,
        ...(currentProfile.responseChecks ?? {}),
      },
    };
    if (state.profile.stages.length === 0) {
      state.profile.stages = defaults.profile.stages;
    }
  };
}

export const useTranslationWorkflowStore = defineStore(
  LSKey.TranslationWorkflow,
  () => {
    const state = useSyncedLocalStorage<TranslationWorkflowState>(
      LSKey.TranslationWorkflow,
      TranslationWorkflowState.defaultValue(),
      TranslationWorkflowState.migrate,
    );

    return { state };
  },
);
