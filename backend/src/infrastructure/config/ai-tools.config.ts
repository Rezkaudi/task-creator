// src/infrastructure/config/ai-tools.config.ts

export const iconTools = [
    {
        type: "function" as const,
        function: {
            name: "searchIcons",
            description: `Search for icons by keyword. Returns up to 10 icon IDs (e.g. "mdi:home", "lucide:arrow-right").

                            Construct the icon URL from the ID using this pattern:
                            https://api.iconify.design/{prefix}/{name}.svg
                            where prefix and name are the two parts split by ':'.
                            Example: "mdi:home" → https://api.iconify.design/mdi/home.svg

                            Select the best icon based on:
                            1. Design System:
                            - Material Design → prefer 'mdi:' or 'ic:' icons
                            - Shadcn/Tailwind → prefer 'lucide:' or 'radix-icons:' icons
                            - Ant Design → prefer 'ant-design:' icons
                            - Modern/Clean → prefer 'solar:' or 'tabler:' icons
                            2. Style: Bold/Filled for buttons; Outline/Linear for navigation
                            3. Match overall design aesthetic`,
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search keyword for the icon (e.g., 'home', 'arrow', 'user', 'settings')"
                    }
                },
                required: ["query"]
            }
        }
    }
];