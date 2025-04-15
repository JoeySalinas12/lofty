// model-config.js - Configuration for supported LLM models
// This file serves as a central place to manage all supported models

/**
 * Model configuration for all supported LLMs
 * Each model has:
 * - id: Unique identifier used in the system
 * - name: Display name for UI
 * - provider: Name of the provider company
 * - apiKeyName: Name of the API key in the storage system
 * - apiEnvName: Name of the environment variable for the API key
 * - requiresApiKey: Whether this model requires an API key
 * - isPaid: Whether this is a paid model or free
 * - defaultFor: Array of mode names this model is the default for (if it's a default)
 * - endpoint: API endpoint for direct API calls (for some free models)
 * - description: Short description of the model's strengths
 */
const MODELS = {
    // Paid models
    "gpt-4-turbo": {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      apiKeyName: "openai",
      apiEnvName: "GPT_API_KEY",
      requiresApiKey: true,
      isPaid: true,
      defaultFor: [],
      description: "Powerful for programming, summarization, and creative content."
    },
    "gpt-4.5": {
      id: "gpt-4.5",
      name: "GPT-4.5",
      provider: "OpenAI",
      apiKeyName: "openai",
      apiEnvName: "GPT_API_KEY",
      requiresApiKey: true,
      isPaid: true,
      defaultFor: [],
      description: "Latest OpenAI model with improved capabilities across all tasks."
    },
    "claude-3.5-sonnet": {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      apiKeyName: "anthropic",
      apiEnvName: "CLAUDE_API_KEY",
      requiresApiKey: true,
      isPaid: true,
      defaultFor: [],
      description: "Excels at reasoning and technical writing with strong factual accuracy."
    },
    "gemini-2-pro": {
      id: "gemini-2-pro",
      name: "Gemini 2 Pro",
      provider: "Google",
      apiKeyName: "gemini",
      apiEnvName: "GEMINI_API_KEY",
      requiresApiKey: true,
      isPaid: true,
      defaultFor: [],
      description: "Good at math and science with strong multilingual capabilities."
    },
    
    // Free models
    "deepseek-v3": {
      id: "deepseek-v3",
      name: "DeepSeek V3",
      provider: "DeepSeek",
      apiKeyName: "deepseek",
      apiEnvName: "DEEPSEEK_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: ["programming", "technical-writing", "math", "science", "academic"],
      endpoint: "https://api.deepseek.com/v1/chat/completions",
      description: "Strong at programming, math & reasoning; free tier option."
    },
    "deepseek-coder": {
      id: "deepseek-coder",
      name: "DeepSeek Coder",
      provider: "DeepSeek",
      apiKeyName: "deepseek",
      apiEnvName: "DEEPSEEK_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: [],
      endpoint: "https://api.deepseek.com/v1/coder/completions",
      description: "Specialized for code generation and programming tasks."
    },
    "openchat-3.5": {
      id: "openchat-3.5",
      name: "OpenChat 3.5",
      provider: "OpenChat",
      apiKeyName: "openchat",
      apiEnvName: "OPENCHAT_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: ["customer-support", "creative-writing", "summarization"],
      endpoint: "https://api.openchat.com/v1/chat/completions",
      description: "Great for technical writing and creative content; free to use."
    },
    "yi-1.5-34b": {
      id: "yi-1.5-34b",
      name: "Yi 1.5 34B",
      provider: "01.AI",
      apiKeyName: "yi",
      apiEnvName: "YI_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: ["productivity"],
      endpoint: "https://api.01.ai/v1/chat/completions",
      description: "Strong performance on business tasks and conversational abilities."
    },
    "gecko-3": {
      id: "gecko-3",
      name: "Gecko 3",
      provider: "Gecko",
      apiKeyName: "gecko",
      apiEnvName: "GECKO_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: [],
      endpoint: "https://api.gecko.ai/v1/chat/completions",
      description: "Efficient for productivity and business applications."
    },
    "gecko-2-mini": {
      id: "gecko-2-mini",
      name: "Gecko 2 Mini",
      provider: "Gecko",
      apiKeyName: "gecko",
      apiEnvName: "GECKO_API_KEY",
      requiresApiKey: false,
      isPaid: false,
      defaultFor: ["multilingual"],
      endpoint: "https://api.gecko.ai/v1/chat/completions",
      description: "Optimized for multilingual tasks with efficient performance."
    }
  };

  /**
   * Map of use cases to recommended models with both paid and free options
   * Based on the April 2025 LLM recommendations PDF
   */
  const USE_CASE_MODELS = {
    "programming": {
      paid: ["claude-3.5-sonnet", "gpt-4-turbo"],
      free: ["deepseek-v3", "deepseek-coder"]
    },
    "technical-writing": {
      paid: ["claude-3.5-sonnet", "gpt-4.5"],
      free: ["openchat-3.5", "deepseek-v3"]
    },
    "math": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["deepseek-v3", "openchat-3.5"]
    },
    "productivity": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["gecko-3", "yi-1.5-34b"]
    },
    "science": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["deepseek-v3", "openchat-3.5"]
    },
    "customer-support": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["openchat-3.5", "yi-1.5-34b"]
    },
    "creative-writing": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["openchat-3.5", "yi-1.5-34b"]
    },
    "summarization": {
      paid: ["gpt-4-turbo", "claude-3.5-sonnet"],
      free: ["openchat-3.5", "yi-1.5-34b"]
    },
    "multilingual": {
      paid: ["claude-3.5-sonnet", "gpt-4.5"],
      free: ["gecko-2-mini", "deepseek-v3"]
    },
    "academic": {
      paid: ["claude-3.5-sonnet", "gpt-4-turbo"],
      free: ["openchat-3.5", "deepseek-v3"]
    }
  };

  /**
   * Get the default model for a given use case
   * @param {string} useCase - The use case
   * @param {boolean} preferFree - Whether to prefer free models
   * @returns {string} - Model ID
   */
  function getDefaultModelForUseCase(useCase, preferFree = true) {
    if (!USE_CASE_MODELS[useCase]) {
      return preferFree ? "deepseek-v3" : "claude-3.5-sonnet"; // Default fallback
    }
    
    const modelList = preferFree ? USE_CASE_MODELS[useCase].free : USE_CASE_MODELS[useCase].paid;
    return modelList[0]; // Return the first (best) model for this use case
  }

  /**
   * Get model details by ID
   * @param {string} modelId - The model ID
   * @returns {object|null} - Model details object or null if not found
   */
  function getModelDetails(modelId) {
    return MODELS[modelId] || null;
  }

  /**
   * Get all available models
   * @param {boolean} includeOnlyPaid - Whether to include only paid models
   * @param {boolean} includeOnlyFree - Whether to include only free models
   * @returns {object[]} - Array of model objects
   */
  function getAllModels(includeOnlyPaid = false, includeOnlyFree = false) {
    return Object.values(MODELS).filter(model => {
      if (includeOnlyPaid) return model.isPaid;
      if (includeOnlyFree) return !model.isPaid;
      return true;
    });
  }

  /**
   * Map old model names to new model IDs for backward compatibility
   */
  const LEGACY_MODEL_MAPPING = {
    "claude": "claude-3.5-sonnet",
    "gpt": "gpt-4-turbo",
    "gemini": "gemini-2-pro"
  };

  /**
   * Convert legacy model name to new model ID
   * @param {string} legacyName - Old model name
   * @returns {string} - New model ID
   */
  function convertLegacyModelName(legacyName) {
    return LEGACY_MODEL_MAPPING[legacyName] || legacyName;
  }

  module.exports = {
    MODELS,
    USE_CASE_MODELS,
    getDefaultModelForUseCase,
    getModelDetails,
    getAllModels,
    convertLegacyModelName
  };