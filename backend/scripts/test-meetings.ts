import { MeetingModel } from '../src/models/AppwriteMeeting';
import { MeetingService } from '../src/services/meetingService';

async function testMeetings() {
  try {
    console.log('🔍 Testing meetings system...\n');
    
    // 1. Check if any meetings exist
    console.log('1. Checking all meetings in database...');
    const allMeetings = await MeetingModel.findMany({});
    console.log(`Found ${allMeetings.length} total meetings:`);
    allMeetings.forEach((meeting, index) => {
      console.log(`  ${index + 1}. Company: ${meeting.companyId}, Scheduled: ${meeting.scheduledDate}, Duration: ${meeting.duration}min`);
    });
    
    // 2. Test upcoming meetings
    console.log('\n2. Testing upcoming meetings (next 7 days)...');
    const meetingService = new MeetingService();
    const upcomingMeetings7 = await meetingService.getUpcomingMeetings(7);
    console.log(`Found ${upcomingMeetings7.length} upcoming meetings (7 days):`);
    upcomingMeetings7.forEach((meeting, index) => {
      console.log(`  ${index + 1}. ${meeting.companyName} - ${meeting.scheduledDate} (${meeting.duration}min)`);
    });
    
    // 3. Test upcoming meetings (next 30 days)
    console.log('\n3. Testing upcoming meetings (next 30 days)...');
    const upcomingMeetings30 = await meetingService.getUpcomingMeetings(30);
    console.log(`Found ${upcomingMeetings30.length} upcoming meetings (30 days):`);
    upcomingMeetings30.forEach((meeting, index) => {
      console.log(`  ${index + 1}. ${meeting.companyName} - ${meeting.scheduledDate} (${meeting.duration}min)`);
    });
    
    // 4. Check date filtering
    console.log('\n4. Checking date filtering...');
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Tomorrow: ${tomorrow.toISOString()}`);
    
    allMeetings.forEach((meeting, index) => {
      const meetingDate = new Date(meeting.scheduledDate);
      const isUpcoming = meetingDate > now;
      const daysDiff = Math.ceil((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  Meeting ${index + 1}: ${meeting.scheduledDate} -> ${isUpcoming ? 'UPCOMING' : 'PAST'} (${daysDiff} days from now)`);
    });
    
  } catch (error: any) {
    console.error('❌ Error testing meetings:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testMeetings().then(() => {
  console.log('\n✨ Meeting test completed!');
  process.exit(0);
});