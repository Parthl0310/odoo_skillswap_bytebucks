# Skill Swap Platform - Backend API

A comprehensive REST API for the Skill Swap Platform built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Registration, login, profile management, and admin controls
- **Skill Discovery**: Search and filter users by skills, location, and availability
- **Swap Requests**: Create, accept, reject, and manage skill swap requests
- **Feedback System**: Rate and review completed swaps
- **Admin Panel**: Comprehensive admin dashboard with user management and announcements
- **Notifications**: Real-time notifications for swap events and admin messages
- **File Upload**: Profile photo upload with validation
- **Security**: Rate limiting, input validation, and security headers

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd skillswap/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/skillswap
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "location": "New York, NY",
  "availability": "weekends",
  "skillsOffered": ["JavaScript", "React"],
  "skillsWanted": ["Python", "Django"],
  "isPublic": true
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user profile

#### PUT `/api/auth/profile`
Update user profile (supports file upload)

### User Endpoints

#### GET `/api/users`
Get all public users with filtering
```
Query Parameters:
- search: Search term
- skill: Filter by skill
- availability: Filter by availability
- location: Filter by location
- page: Page number
- limit: Items per page
```

#### GET `/api/users/:id`
Get specific user profile

#### GET `/api/users/:id/skill-matches`
Get users that match skills with the given user

#### GET `/api/users/search/skills`
Search users by skill
```
Query Parameters:
- skill: Skill to search for
- type: "offered" or "wanted"
```

### Swap Request Endpoints

#### POST `/api/swaps`
Create a new swap request
```json
{
  "toUserId": "user_id",
  "skillOffered": "JavaScript",
  "skillWanted": "Python",
  "message": "I'd love to learn Python from you!"
}
```

#### GET `/api/swaps`
Get user's swap requests
```
Query Parameters:
- status: Filter by status
- type: "sent" or "received"
```

#### PUT `/api/swaps/:id/accept`
Accept a swap request

#### PUT `/api/swaps/:id/reject`
Reject a swap request

#### PUT `/api/swaps/:id/complete`
Complete a swap request

#### DELETE `/api/swaps/:id`
Cancel a swap request

### Feedback Endpoints

#### POST `/api/feedback/:swapId`
Add feedback for completed swap
```json
{
  "rating": 5,
  "comment": "Great experience!"
}
```

#### GET `/api/feedback/:swapId`
Get feedback for specific swap

#### GET `/api/feedback/user/:userId`
Get feedback for specific user

### Admin Endpoints

#### GET `/api/admin/dashboard`
Get admin dashboard statistics

#### GET `/api/admin/users`
Get all users with admin filtering

#### PUT `/api/admin/users/:id/ban`
Ban a user

#### PUT `/api/admin/users/:id/unban`
Unban a user

#### PUT `/api/admin/users/:id/role`
Change user role

#### GET `/api/admin/swaps`
Get all swap requests

#### POST `/api/admin/messages`
Create admin announcement
```json
{
  "title": "System Maintenance",
  "message": "We'll be performing maintenance tonight",
  "type": "maintenance",
  "isGlobal": true
}
```

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User
- Basic info (name, email, location, photo)
- Skills (offered and wanted)
- Availability settings
- Privacy settings
- Rating and review count
- Admin and ban status

### SwapRequest
- From and to users
- Skills being exchanged
- Status (pending, accepted, rejected, completed, cancelled)
- Feedback from both users
- Timestamps

### Notification
- User notifications for various events
- Read/unread status
- Related entity references

### AdminMessage
- Admin announcements and messages
- Global or targeted delivery
- Expiration dates
- Active/inactive status

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configurable CORS settings
- **Helmet**: Security headers
- **File Upload Validation**: Image file validation and size limits

## 🚀 Deployment

### Environment Variables
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Production Considerations
- Use environment variables for all sensitive data
- Set up proper MongoDB indexes
- Configure CORS for your domain
- Set up file upload to cloud storage (Cloudinary)
- Enable HTTPS in production
- Set up proper logging and monitoring

## 📝 Scripts

```bash
# Development
npm run dev

# Production
npm start

# Testing
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team. 