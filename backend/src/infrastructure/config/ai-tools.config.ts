// src/infrastructure/config/ai-tools.config.ts

export const iconTools = [
    {
        type: "function" as const,
        function: {
            name: "searchIcons",
            description: `Search for icons by keyword and get a list of available icons. 
            
                            After receiving results, YOU MUST select the best icon based on:
                            1. Design System: 
                            - Material Design → prefer 'mdi:' or 'ic:' icons
                            - Shadcn/Tailwind → prefer 'lucide:' or 'radix-icons:' icons
                            - Ant Design → prefer 'ant-design:' icons
                            - Modern/Clean → prefer 'solar:' or 'tabler:' icons
                            2. Style consistency:
                            - Bold/Filled icons for buttons and emphasis
                            - Outline/Linear icons for navigation and subtle UI
                            3. Match the overall design aesthetic

                            Returns array of icon identifiers like 'solar:home-bold', 'mdi:home'.`,
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
    },
    {
        type: "function" as const,
        function: {
            name: "getIconUrl",
            description: "Convert the SELECTED icon identifier to SVG URL. Call this AFTER selecting the best icon from searchIcons results.",
            parameters: {
                type: "object",
                properties: {
                    iconData: {
                        type: "string",
                        description: "Selected icon identifier in format 'prefix:name' (e.g., 'solar:home-bold')"
                    }
                },
                required: ["iconData"]
            }
        }
    }
];