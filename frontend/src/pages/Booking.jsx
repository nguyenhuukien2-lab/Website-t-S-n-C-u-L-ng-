import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.darker};
  padding: 4rem 2rem;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  text-align: center;
`;

const BookingForm = styled(motion.form)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  background: linear-gradient(135deg, ${props => props.theme.dark}, ${props => props.theme.darker});
  border: 2px solid ${props => props.theme.primary};
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 0 30px ${props => props.theme.glow};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: ${props => props.theme.dark};
  border: 2px solid ${props => props.theme.dark};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 15px ${props => props.theme.glow};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  background: ${props => props.theme.dark};
  border: 2px solid ${props => props.theme.dark};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 15px ${props => props.theme.glow};
  }

  option {
    background: ${props => props.theme.dark};
    color: ${props => props.theme.text};
  }
`;

const SubmitButton = styled.button`
  grid-column: 1 / -1;
  padding: 12px;
  background: ${props => props.theme.primary};
  color: ${props => props.theme.darker};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px ${props => props.theme.glow};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 30px ${props => props.theme.glow};
    background: ${props => props.theme.secondary};
  }
`;

const BookingsList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const BookingCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.theme.dark}, ${props => props.theme.darker});
  border: 2px solid ${props => props.theme.primary};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 0 20px ${props => props.theme.glow};

  h3 {
    color: ${props => props.theme.primary};
    margin-bottom: 1rem;
  }

  p {
    color: ${props => props.theme.textSecondary};
    margin-bottom: 0.5rem;
  }

  .status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 1rem;
    background: ${props => props.theme.primary}20;
    color: ${props => props.theme.primary};
  }
`;

export const Booking = () => {
  const { theme } = useTheme();
  const [bookingData, setBookingData] = useState({
    court: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const [bookings, setBookings] = useState([
    { id: 1, court: 'Sân A1', date: '2026-05-25', time: '14:00 - 16:00', status: 'Đã xác nhận' },
    { id: 2, court: 'Sân B2', date: '2026-05-28', time: '19:00 - 21:00', status: 'Chờ xác nhận' },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking data:', bookingData);
    alert('Đặt sân thành công! Vui lòng kiểm tra email để xác nhận.');
    setBookingData({ court: '', date: '', startTime: '', endTime: '', notes: '' });
  };

  return (
    <PageContainer theme={theme}>
      <Container>
        <Title theme={theme}>Đặt Lịch</Title>

        <BookingForm
          theme={theme}
          as={motion.form}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
        >
          <FormGroup>
            <Label theme={theme}>Chọn Sân</Label>
            <Select
              theme={theme}
              name="court"
              value={bookingData.court}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn sân --</option>
              <option value="san-a1">Sân A1 (150.000 VND/h)</option>
              <option value="san-a2">Sân A2 (150.000 VND/h)</option>
              <option value="san-b1">Sân B1 (180.000 VND/h)</option>
              <option value="san-b2">Sân B2 (180.000 VND/h)</option>
              <option value="san-vip">Sân VIP (250.000 VND/h)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Ngày Đặt</Label>
            <Input
              theme={theme}
              type="date"
              name="date"
              value={bookingData.date}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Giờ Bắt Đầu</Label>
            <Input
              theme={theme}
              type="time"
              name="startTime"
              value={bookingData.startTime}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label theme={theme}>Giờ Kết Thúc</Label>
            <Input
              theme={theme}
              type="time"
              name="endTime"
              value={bookingData.endTime}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup $fullWidth>
            <Label theme={theme}>Ghi Chú</Label>
            <Input
              theme={theme}
              type="text"
              name="notes"
              value={bookingData.notes}
              onChange={handleChange}
              placeholder="Ghi chú thêm (tùy chọn)"
            />
          </FormGroup>

          <SubmitButton theme={theme}>Đặt Sân</SubmitButton>
        </BookingForm>

        <Title theme={theme} style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
          Lịch Sử Đặt Sân
        </Title>

        <BookingsList>
          {bookings.map((booking, index) => (
            <BookingCard
              key={booking.id}
              theme={theme}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h3>{booking.court}</h3>
              <p>📅 Ngày: {booking.date}</p>
              <p>🕐 Giờ: {booking.time}</p>
              <span className="status">{booking.status}</span>
            </BookingCard>
          ))}
        </BookingsList>
      </Container>
    </PageContainer>
  );
};
