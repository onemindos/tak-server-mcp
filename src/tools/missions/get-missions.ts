import { TAKTool, ToolContext } from '../registry';

export const getMissionsTool: TAKTool = {
  name: 'tak_get_missions',
  description: 'List TAK missions or fetch a specific mission by name',
  category: 'missions',
  requiresAuth: true,
  requiresWrite: false,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Mission name to fetch instead of the full mission list'
      }
    }
  },
  async handler(context: ToolContext) {
    const { takClient, params, logger } = context;

    logger.info('Retrieving missions', { params });

    try {
      if (params.name) {
        const mission = await takClient.getMission(params.name);
        return {
          success: true,
          count: 1,
          missions: [mission],
          mission
        };
      }

      const rawMissions = await takClient.getMissions();
      const missions = normalizeMissions(rawMissions);

      return {
        success: true,
        count: missions.length,
        missions,
        raw: rawMissions
      };
    } catch (error) {
      logger.error('Failed to retrieve missions', error);
      throw error;
    }
  }
};

function normalizeMissions(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === 'object') {
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data;
    }

    if (data !== undefined) {
      return [data];
    }

    return [raw];
  }

  return [];
}
