const mongoose = require('mongoose');
require('dotenv').config();

// Import the PendingNews model
const PendingNews = require('../models/PendingNews');

// Sample pending news data
const samplePendingNews = [
    {
        title: 'भारत में AI तकनीक का तेजी से विकास',
        titleEn: 'Rapid Development of AI Technology in India',
        excerpt: 'भारत में कृत्रिम बुद्धिमत्ता (AI) तकनीक में तेजी से विकास हो रहा है। कई कंपनियां AI-आधारित समाधान विकसित कर रही हैं।',
        content: 'भारत में कृत्रिम बुद्धिमत्ता (AI) तकनीक में तेजी से विकास हो रहा है। कई कंपनियां AI-आधारित समाधान विकसित कर रही हैं जो विभिन्न क्षेत्रों में क्रांतिकारी बदलाव ला रहे हैं। सरकार भी AI को बढ़ावा देने के लिए विभिन्न योजनाएं चला रही है।',
        category: 'National',
        tags: ['AI', 'Technology', 'India', 'Innovation'],
        pages: ['home', 'national'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: true,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'क्रिकेट विश्व कप में भारत की शानदार जीत',
        titleEn: 'India\'s Spectacular Victory in Cricket World Cup',
        excerpt: 'भारतीय क्रिकेट टीम ने विश्व कप में शानदार प्रदर्शन करते हुए महत्वपूर्ण मैच जीता।',
        content: 'भारतीय क्रिकेट टीम ने विश्व कप में शानदार प्रदर्शन करते हुए महत्वपूर्ण मैच जीता। टीम के कप्तान ने उत्कृष्ट नेतृत्व दिखाया और खिलाड़ियों ने बेहतरीन प्रदर्शन किया। यह जीत भारत के लिए बहुत महत्वपूर्ण है।',
        category: 'Sports',
        tags: ['Cricket', 'World Cup', 'India', 'Victory'],
        pages: ['home', 'sports'],
        author: 'News Adda India',
        image: '',
        isBreaking: true,
        isFeatured: true,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'अंतर्राष्ट्रीय व्यापार में नए अवसर',
        titleEn: 'New Opportunities in International Trade',
        excerpt: 'वैश्विक बाजार में भारतीय उत्पादों की मांग बढ़ रही है, जिससे व्यापार में नए अवसर पैदा हो रहे हैं।',
        content: 'वैश्विक बाजार में भारतीय उत्पादों की मांग बढ़ रही है, जिससे व्यापार में नए अवसर पैदा हो रहे हैं। कई देशों के साथ नए व्यापार समझौते हुए हैं जो भारतीय अर्थव्यवस्था के लिए फायदेमंद साबित हो रहे हैं।',
        category: 'Business',
        tags: ['Trade', 'International', 'Economy', 'Business'],
        pages: ['home', 'business'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: false,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'बॉलीवुड में नई फिल्मों की रिलीज',
        titleEn: 'New Movie Releases in Bollywood',
        excerpt: 'इस सप्ताह बॉलीवुड में कई बड़ी फिल्में रिलीज हो रही हैं, जिनकी दर्शकों में काफी उत्सुकता है।',
        content: 'इस सप्ताह बॉलीवुड में कई बड़ी फिल्में रिलीज हो रही हैं, जिनकी दर्शकों में काफी उत्सुकता है। इन फिल्मों में बड़े सितारे हैं और उम्मीद है कि ये बॉक्स ऑफिस पर अच्छा प्रदर्शन करेंगी।',
        category: 'Entertainment',
        tags: ['Bollywood', 'Movies', 'Entertainment', 'Cinema'],
        pages: ['home', 'entertainment'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: false,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'स्वास्थ्य सेवाओं में सुधार की पहल',
        titleEn: 'Initiatives to Improve Healthcare Services',
        excerpt: 'सरकार ने स्वास्थ्य सेवाओं में सुधार के लिए नई योजनाएं शुरू की हैं जो आम जनता के लिए फायदेमंद होंगी।',
        content: 'सरकार ने स्वास्थ्य सेवाओं में सुधार के लिए नई योजनाएं शुरू की हैं जो आम जनता के लिए फायदेमंद होंगी। इन योजनाओं के तहत ग्रामीण क्षेत्रों में भी बेहतर स्वास्थ्य सुविधाएं उपलब्ध कराई जाएंगी।',
        category: 'Health',
        tags: ['Health', 'Healthcare', 'Government', 'Welfare'],
        pages: ['home', 'health'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: false,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'राजनीतिक दलों के बीच नए गठबंधन',
        titleEn: 'New Alliances Between Political Parties',
        excerpt: 'राजनीतिक दलों के बीच नए गठबंधन बन रहे हैं जो आगामी चुनावों को प्रभावित कर सकते हैं।',
        content: 'राजनीतिक दलों के बीच नए गठबंधन बन रहे हैं जो आगामी चुनावों को प्रभावित कर सकते हैं। इन गठबंधनों का राजनीतिक परिदृश्य पर महत्वपूर्ण प्रभाव पड़ेगा।',
        category: 'Politics',
        tags: ['Politics', 'Elections', 'Alliance', 'Government'],
        pages: ['home', 'politics'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: false,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'वैश्विक जलवायु सम्मेलन में भारत की भागीदारी',
        titleEn: 'India\'s Participation in Global Climate Summit',
        excerpt: 'भारत ने वैश्विक जलवायु सम्मेलन में सक्रिय भागीदारी की और पर्यावरण संरक्षण के लिए अपनी प्रतिबद्धता दोहराई।',
        content: 'भारत ने वैश्विक जलवायु सम्मेलन में सक्रिय भागीदारी की और पर्यावरण संरक्षण के लिए अपनी प्रतिबद्धता दोहराई। भारत ने कार्बन उत्सर्जन कम करने के लिए कई महत्वपूर्ण कदम उठाए हैं।',
        category: 'International',
        tags: ['Climate', 'Environment', 'Global', 'Summit'],
        pages: ['home', 'international'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: true,
        generatedBy: 'openai',
        generatedAt: new Date()
    },
    {
        title: 'शिक्षा क्षेत्र में डिजिटल क्रांति',
        titleEn: 'Digital Revolution in Education Sector',
        excerpt: 'शिक्षा क्षेत्र में डिजिटल तकनीक का उपयोग बढ़ रहा है, जिससे छात्रों को बेहतर शिक्षा मिल रही है।',
        content: 'शिक्षा क्षेत्र में डिजिटल तकनीक का उपयोग बढ़ रहा है, जिससे छात्रों को बेहतर शिक्षा मिल रही है। ऑनलाइन शिक्षा प्लेटफॉर्म और डिजिटल कक्षाएं अब आम हो गई हैं।',
        category: 'National',
        tags: ['Education', 'Digital', 'Technology', 'Students'],
        pages: ['home', 'national'],
        author: 'News Adda India',
        image: '',
        isBreaking: false,
        isFeatured: false,
        generatedBy: 'openai',
        generatedAt: new Date()
    }
];

// Connect to MongoDB and insert sample data
async function seedPendingNews() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing pending news (optional - comment out if you want to keep existing data)
        // await PendingNews.deleteMany({});
        // console.log('Cleared existing pending news');

        // Insert sample data
        const inserted = await PendingNews.insertMany(samplePendingNews);
        console.log(`Successfully inserted ${inserted.length} pending news articles`);

        // Display inserted articles
        console.log('\nInserted articles:');
        inserted.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} (${article.category})`);
        });

        // Close connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding pending news:', error);
        process.exit(1);
    }
}

// Run the seed function
seedPendingNews();

