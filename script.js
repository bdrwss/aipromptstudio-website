// AI Prompt Studio 官网交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initNavigation();
    initScrollEffects();
    initAnimations();
    initFormHandling();
    initDownloadTracking();
    initThemeToggle();
});

// 导航栏功能
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // 滚动时导航栏样式变化
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 移动端菜单切换
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // 平滑滚动到锚点
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 70; // 导航栏高度
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                // 关闭移动端菜单
                if (navMenu.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // 高亮当前页面部分
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// 滚动效果
function initScrollEffects() {
    // 创建 Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.feature-card, .tech-item, .download-card, .doc-card, .pattern-item');
    animateElements.forEach(el => {
        el.classList.add('animate-element');
        observer.observe(el);
    });
}

// 动画效果
function initAnimations() {
    // 数字计数动画
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    });

    stats.forEach(stat => statsObserver.observe(stat));

    // 打字机效果（可选）
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // 可以在这里添加打字机效果
    }
}

// 数字计数动画
function animateNumber(element) {
    const target = element.textContent;
    const isPercentage = target.includes('%');
    const isK = target.includes('K');
    const numericValue = parseFloat(target.replace(/[^\d.]/g, ''));
    
    let current = 0;
    const increment = numericValue / 50; // 50步完成动画
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        let displayValue = Math.floor(current);
        if (isK) displayValue += 'K';
        if (isPercentage) displayValue += '%';
        if (target.includes('+')) displayValue += '+';
        
        element.textContent = displayValue;
    }, 30);
}

// 表单处理
function initFormHandling() {
    const contactForm = document.querySelector('.form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // 表单验证
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // 验证表单
    if (!validateForm(data)) {
        return;
    }
    
    // 显示加载状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
    submitBtn.disabled = true;
    
    // 模拟发送（实际项目中替换为真实的API调用）
    setTimeout(() => {
        showNotification('消息发送成功！我们会尽快回复您。', 'success');
        e.target.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// 表单验证
function validateForm(data) {
    let isValid = true;
    
    // 验证必填字段
    const requiredFields = ['name', 'email', 'subject', 'message'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            showFieldError(field, '此字段为必填项');
            isValid = false;
        }
    });
    
    // 验证邮箱格式
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', '请输入有效的邮箱地址');
        isValid = false;
    }
    
    return isValid;
}

// 验证单个字段
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field.name, '此字段为必填项');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field.name, '请输入有效的邮箱地址');
        return false;
    }
    
    clearFieldError(field.name);
    return true;
}

// 显示字段错误
function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    clearFieldError(fieldName);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--danger-color)';
    errorElement.style.fontSize = 'var(--font-size-sm)';
    errorElement.style.marginTop = 'var(--spacing-xs)';
    
    field.parentNode.appendChild(errorElement);
    field.style.borderColor = 'var(--danger-color)';
}

// 清除字段错误
function clearFieldError(fieldName) {
    const field = typeof fieldName === 'string' 
        ? document.querySelector(`[name="${fieldName}"]`)
        : fieldName.target || fieldName;
    
    if (!field) return;
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.style.borderColor = '';
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 下载跟踪
function initDownloadTracking() {
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const platform = btn.textContent.includes('Windows') ? 'windows' :
                           btn.textContent.includes('macOS') ? 'macos' : 'linux';
            
            // 跟踪下载事件（可以集成 Google Analytics 等）
            trackDownload(platform);
            
            // 显示下载提示
            showNotification(`正在准备 ${platform} 版本的下载...`, 'info');
            
            // 实际项目中这里应该触发真实的下载
            setTimeout(() => {
                showNotification('下载即将开始，感谢您使用 AI Prompt Studio！', 'success');
            }, 1500);
        });
    });
}

// 跟踪下载事件
function trackDownload(platform) {
    // 这里可以集成分析工具
    console.log(`Download tracked: ${platform}`);
    
    // Google Analytics 示例（如果已集成）
    if (typeof gtag !== 'undefined') {
        gtag('event', 'download', {
            'event_category': 'software',
            'event_label': platform,
            'value': 1
        });
    }
}

// 主题切换（可选功能）
function initThemeToggle() {
    // 可以添加暗色主题切换功能
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// 切换主题
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getNotificationColor(type),
        color: 'white',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
    });
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// 获取通知颜色
function getNotificationColor(type) {
    const colors = {
        success: 'var(--secondary-color)',
        error: 'var(--danger-color)',
        warning: 'var(--accent-color)',
        info: 'var(--primary-color)'
    };
    return colors[type] || colors.info;
}

// 添加 CSS 动画类
const style = document.createElement('style');
style.textContent = `
    .animate-element {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .animate-element.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: var(--shadow-md);
    }
    
    .nav-link.active {
        color: var(--primary-color);
    }
    
    .nav-link.active::after {
        width: 100%;
    }
    
    @media (max-width: 768px) {
        .hamburger.active .bar:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .hamburger.active .bar:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active .bar:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
        
        .nav-menu.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            box-shadow: var(--shadow-lg);
            padding: var(--spacing-md);
            gap: var(--spacing-md);
        }
    }
`;
document.head.appendChild(style);
