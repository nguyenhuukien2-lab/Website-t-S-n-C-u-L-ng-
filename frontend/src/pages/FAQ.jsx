import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.darker};
  padding: 4rem 2rem;
`;

const Section = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 3rem;
  text-align: center;
`;

const FAQItem = styled(motion.div)`
  margin-bottom: 1.5rem;
  border: 2px solid ${props => props.$isOpen ? props.theme.primary : props.theme.dark};
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, ${props => props.theme.dark}, ${props => props.theme.darker});
  transition: all 0.3s ease;
  box-shadow: ${props => props.$isOpen ? `0 0 20px ${props.theme.glow}` : 'none'};
`;

const FAQHeader = styled.button`
  width: 100%;
  padding: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${props => props.theme.text};
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: ${props => props.theme.primary};
  }

  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const FAQContent = styled(motion.div)`
  background: ${props => props.theme.dark};
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.primary}20;
  color: ${props => props.theme.textSecondary};
  line-height: 1.6;
`;

export const FAQ = () => {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Làm cách nào để đặt sân cầu lông?',
      answer:
        'Bạn có thể đặt sân thông qua website hoặc ứng dụng di động. Chọn ngày, giờ, và loại sân mà bạn muốn. Sau đó thanh toán và xác nhận đặt chỗ của bạn.',
    },
    {
      question: 'Chi phí hủy đặt sân là bao nhiêu?',
      answer:
        'Nếu bạn hủy trước 24 giờ, không có chi phí hủy. Nếu hủy từ 12-24 giờ, sẽ mất 25% tiền đặt. Hủy trong vòng 12 giờ sẽ mất 50% tiền đặt.',
    },
    {
      question: 'Các phương thức thanh toán nào được chấp nhận?',
      answer:
        'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, ví điện tử, chuyển khoản ngân hàng, và thanh toán tại quầy.',
    },
    {
      question: 'Tôi có thể đặt sân trước bao lâu?',
      answer:
        'Bạn có thể đặt sân trước tối đa 30 ngày. Đặt sân sớm để đảm bảo có sân phù hợp với lịch trình của bạn.',
    },
    {
      question: 'Có hỗ trợ khách hàng 24/7 không?',
      answer:
        'Có, chúng tôi có đội hỗ trợ khách hàng 24/7. Bạn có thể liên hệ qua chat, email, hoặc điện thoại.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PageContainer theme={theme}>
      <Section>
        <Title theme={theme}>Câu Hỏi Thường Gặp</Title>

        <div>
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              theme={theme}
              $isOpen={openIndex === index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FAQHeader
                theme={theme}
                $isOpen={openIndex === index}
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <FiChevronDown size={20} />
              </FAQHeader>
              <AnimatePresence>
                {openIndex === index && (
                  <FAQContent
                    theme={theme}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.answer}
                  </FAQContent>
                )}
              </AnimatePresence>
            </FAQItem>
          ))}
        </div>
      </Section>
    </PageContainer>
  );
};
