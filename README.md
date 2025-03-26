# Deep Content

Deep Content is a sophisticated content creation tool that helps users develop well-researched, authentic content that truly reflects their voice. The app uses AI to guide the content creation process while ensuring the user's perspective remains central.

## Features

- **Content Ideation**: Start with your content idea and choose from multiple content types (blog, social media, YouTube script, news article, podcast script)
- **Follow-up Questions**: The app generates thoughtful follow-up questions to extract your unique perspective on the topic
- **Deep Research**: Leverages Perplexity's Sonar-pro model to conduct comprehensive research related to your content
- **Content Generation**: Uses Claude AI to craft polished content that combines your original ideas with research findings
- **User-Centric Approach**: Your voice always remains central - research only enhances, never replaces your ideas

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your API keys:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Usage Workflow

1. **Enter Your Idea**: Describe your content idea and select the content type you want to create
2. **Answer Follow-up Questions**: Respond to AI-generated questions to add depth to your idea
3. **Review Research**: The app conducts deep research to supplement your content
4. **Get Your Content**: The final content is generated combining your ideas with the research

## Technologies Used

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Anthropic Claude AI
- Perplexity Sonar-pro

## Future Enhancements

- User authentication for saving content projects
- Content history and revision tracking
- Additional content types and formats
- Direct publication to various platforms