/**
 * AI对话保存工具 - 主JavaScript文件
 * 功能：实现对话文本和思考逻辑的添加、保存、显示和删除功能
 */

// 对话数据管理类
class DialogueManager {
    /**
     * 构造函数
     * 初始化对话管理器和本地存储键名
     */
    constructor() {
        this.storageKey = 'ai_dialogues';
        this.dialogues = this.loadDialogues();
        this.initEventListeners();
        this.renderDialogues();
    }

    /**
     * 从本地存储加载对话数据
     * @returns {Array} 对话数据数组，如果不存在则返回空数组
     */
    loadDialogues() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载对话数据失败:', error);
            return [];
        }
    }

    /**
     * 保存对话数据到本地存储
     */
    saveDialogues() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.dialogues));
        } catch (error) {
            console.error('保存对话数据失败:', error);
        }
    }

    /**
     * 添加新的对话
     * @param {string} role - 角色类型：'questioner' 或 'responder'
     * @param {string} dialogueText - 对话文本内容
     * @param {string} thinkText - 思考逻辑内容
     * @returns {boolean} 添加成功返回true，失败返回false
     */
    addDialogue(role, dialogueText, thinkText) {
        if (!dialogueText.trim()) {
            this.showMessage('请输入对话内容', 'error');
            return false;
        }

        const newDialogue = {
            id: Date.now().toString(),
            role: role,
            dialogue: dialogueText.trim(),
            think: role === 'responder' ? thinkText.trim() : '',
            timestamp: new Date().toLocaleString('zh-CN')
        };

        this.dialogues.push(newDialogue);
        this.saveDialogues();
        this.renderDialogues();
        this.showMessage('对话添加成功', 'success');
        return true;
    }

    /**
     * 删除指定ID的对话
     * @param {string} id - 要删除的对话ID
     */
    deleteDialogue(id) {
        if (confirm('确定要删除这条对话吗？')) {
            this.dialogues = this.dialogues.filter(dialogue => dialogue.id !== id);
            this.saveDialogues();
            this.renderDialogues();
            this.showMessage('对话删除成功', 'success');
        }
    }

    /**
     * 复制对话的原始markdown格式内容到剪贴板
     * @param {string} id - 要复制的对话ID
     */
    copyDialogue(id) {
        const dialogue = this.dialogues.find(d => d.id === id);
        if (!dialogue) {
            this.showMessage('找不到对话内容', 'error');
            return;
        }
        
        // 构建要复制的内容
        let content = '';
        if (dialogue.think) {
            content += `思考逻辑：\n${dialogue.think}\n\n`;
        }
        content += dialogue.dialogue;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(content)
            .then(() => {
                this.showMessage('对话内容已复制到剪贴板', 'success');
            })
            .catch(err => {
                console.error('复制失败:', err);
                this.showMessage('复制失败，请手动复制', 'error');
            });
    }

    /**
     * 渲染所有对话到页面
     */
    renderDialogues() {
        const container = document.getElementById('dialogueContainer');
        
        if (this.dialogues.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>暂无保存的对话</h3>
                    <p>请在上方添加您的第一条AI对话</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.dialogues.map(dialogue => `
            <div class="dialogue-item ${dialogue.role === 'questioner' ? 'dialogue-right' : 'dialogue-left'}" data-id="${dialogue.id}">
                <div class="dialogue-avatar">
                    <div class="avatar ${dialogue.role === 'questioner' ? 'avatar-questioner' : 'avatar-responder'}">
                        ${dialogue.role === 'questioner' ? '👤' : '🤖'}
                    </div>
                </div>
                <div class="dialogue-content-wrapper">
                    <div class="dialogue-header">
                        <div class="dialogue-role">
                            <span class="role-badge ${dialogue.role === 'questioner' ? 'role-questioner' : 'role-responder'}">
                                ${dialogue.role === 'questioner' ? '提问者' : '回答者'}
                            </span>
                        </div>
                        <div class="dialogue-time">${dialogue.timestamp}</div>
                        <button class="copy-btn" onclick="dialogueManager.copyDialogue('${dialogue.id}')" title="复制原始markdown">
                            📋
                        </button>
                    </div>
                    <div class="dialogue-content">
                        ${dialogue.think ? `
                        <div class="think-text">
                            <strong>思考逻辑：</strong>
                            <p>${this.formatContent(dialogue.think)}</p>
                        </div>
                        ` : ''}
                        <div class="dialogue-text">
                            <p>${this.formatContent(dialogue.dialogue)}</p>
                        </div>
                    </div>
                    <div class="dialogue-actions">
                        <button class="btn-danger" onclick="dialogueManager.deleteDialogue('${dialogue.id}')">
                            删除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * HTML转义函数，防止XSS攻击
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的安全文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化内容，处理换行和基本markdown格式
     * @param {string} text - 需要格式化的文本
     * @returns {string} 格式化后的HTML文本
     */
    formatContent(text) {
        if (!text) return '';
        
        // 1. 首先进行HTML转义，防止XSS攻击
        let formatted = this.escapeHtml(text);
        
        // 2. 处理基本markdown格式（在处理换行符之前）
        // 标题 # H1, ## H2, ### H3, #### H4, ##### H5, ###### H6
        formatted = formatted.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
        formatted = formatted.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
        formatted = formatted.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        // 粗体 **text**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // 斜体 *text*
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // 无序列表：- item, * item, + item
        formatted = formatted.replace(/^(?:-|\*|\+) (.*?)$/gm, '<li>$1</li>');
        // 包裹列表项到ul标签
        formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
        // 3. 最后处理换行符
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * 显示消息提示
     * @param {string} message - 要显示的消息内容
     * @param {string} type - 消息类型：'success' 或 'error'
     */
    showMessage(message, type) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;

        // 添加到页面
        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 初始化所有事件监听器
     */
    initEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        const importBtn = document.getElementById('import-btn');
        const fileInput = document.getElementById('file-input');
        
        // 模态窗口相关元素
        const modal = document.getElementById('addDialogModal');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmAddBtn = document.getElementById('confirmAddBtn');
        const modalThinkInputGroup = document.getElementById('modalThinkInputGroup');
        const roleButtons = document.querySelectorAll('.role-btn');

        // 添加按钮点击事件 - 打开模态窗口
        addBtn.addEventListener('click', () => {
            this.openAddDialogModal();
        });

        // 模态窗口关闭事件
        closeModal.addEventListener('click', () => {
            this.closeAddDialogModal();
        });

        // 取消按钮事件
        cancelBtn.addEventListener('click', () => {
            this.closeAddDialogModal();
        });

        // 确认添加按钮事件
        confirmAddBtn.addEventListener('click', () => {
            this.handleModalAddDialogue();
        });

        // 角色按钮点击事件
        roleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleRoleButtonClick(button);
            });
        });

        // 点击模态窗口背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeAddDialogModal();
            }
        });

        // ESC键关闭模态窗口
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeAddDialogModal();
            }
        });

        // 导入按钮点击事件
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择变化事件
        fileInput.addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // 导出按钮点击事件
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        // 清除按钮点击事件
        clearBtn.addEventListener('click', () => {
            this.clearAllData();
        });

        // 初始化模态窗口角色状态
        this.updateThinkInputVisibility('user');

        // 添加动画样式
        this.addAnimationStyles();
    }



    /**
     * 添加动画样式到页面
     */
    addAnimationStyles() {
        if (!document.getElementById('custom-animations')) {
            const style = document.createElement('style');
            style.id = 'custom-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 导出所有对话数据为JSON文件
     */
    exportData() {
        if (this.dialogues.length === 0) {
            this.showMessage('没有数据可导出', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.dialogues, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ai_dialogues_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('数据导出成功', 'success');
    }

    /**
     * 处理文件导入
     * @param {Event} e - 文件选择事件
     */
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            this.showMessage('请选择JSON格式的文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('文件格式不正确');
                }

                // 验证导入数据的结构
                const isValid = importedData.every(item => 
                    item && 
                    typeof item.id === 'string' &&
                    typeof item.role === 'string' &&
                    typeof item.dialogue === 'string' &&
                    typeof item.timestamp === 'string'
                );

                if (!isValid) {
                    throw new Error('文件数据结构不正确');
                }

                // 合并导入数据（避免重复ID）
                const existingIds = new Set(this.dialogues.map(d => d.id));
                const newDialogues = importedData.filter(item => !existingIds.has(item.id));
                
                if (newDialogues.length === 0) {
                    this.showMessage('没有新的对话数据可导入', 'info');
                    return;
                }

                this.dialogues.unshift(...newDialogues);
                this.saveDialogues();
                this.renderDialogues();
                this.showMessage(`成功导入 ${newDialogues.length} 条对话`, 'success');
                
            } catch (error) {
                console.error('导入文件失败:', error);
                this.showMessage('文件导入失败：' + error.message, 'error');
            }
        };

        reader.onerror = () => {
            this.showMessage('文件读取失败', 'error');
        };

        reader.readAsText(file);
        
        // 清空文件输入，允许重复选择同一文件
        e.target.value = '';
    }

    /**
     * 清空所有对话数据
     */
    clearAllData() {
        if (this.dialogues.length === 0) {
            this.showMessage('没有数据可清空', 'error');
            return;
        }

        if (confirm('确定要清空所有对话数据吗？此操作不可恢复！')) {
            this.dialogues = [];
            this.saveDialogues();
            this.renderDialogues();
            this.showMessage('所有数据已清空', 'success');
        }
    }

    /**
     * 打开添加对话模态窗口
     */
    openAddDialogModal() {
        const modal = document.getElementById('addDialogModal');
        const modalDialogueInput = document.getElementById('modalDialogueInput');
        
        // 重置模态窗口内容
        modalDialogueInput.value = '';
        document.getElementById('modalThinkInput').value = '';
        
        // 重置角色按钮状态（默认选择提问者）
        this.setActiveRoleButton('user');
        
        // 显示模态窗口
        modal.style.display = 'flex';
        
        // 焦点设置到对话输入框
        setTimeout(() => {
            modalDialogueInput.focus();
        }, 100);
    }

    /**
     * 关闭添加对话模态窗口
     */
    closeAddDialogModal() {
        const modal = document.getElementById('addDialogModal');
        modal.style.display = 'none';
    }

    /**
     * 处理角色按钮点击
     * @param {HTMLElement} clickedButton - 被点击的角色按钮
     */
    handleRoleButtonClick(clickedButton) {
        const role = clickedButton.dataset.role;
        this.setActiveRoleButton(role);
        this.updateThinkInputVisibility(role);
    }

    /**
     * 设置激活的角色按钮
     * @param {string} role - 角色类型（user 或 responder）
     */
    setActiveRoleButton(role) {
        const roleButtons = document.querySelectorAll('.role-btn');
        roleButtons.forEach(button => {
            if (button.dataset.role === role) {
                button.classList.add('role-btn-active');
            } else {
                button.classList.remove('role-btn-active');
            }
        });
    }

    /**
     * 更新思考逻辑输入框的显示状态
     * @param {string} role - 角色类型
     */
    updateThinkInputVisibility(role) {
        const modalThinkInputGroup = document.getElementById('modalThinkInputGroup');
        
        if (role === 'responder') {
            modalThinkInputGroup.style.display = 'block';
        } else {
            modalThinkInputGroup.style.display = 'none';
            document.getElementById('modalThinkInput').value = '';
        }
    }

    /**
     * 处理模态窗口添加对话的逻辑
     */
    handleModalAddDialogue() {
        const activeRoleButton = document.querySelector('.role-btn-active');
        const role = activeRoleButton ? activeRoleButton.dataset.role : 'user';
        const dialogueText = document.getElementById('modalDialogueInput').value;
        const thinkText = document.getElementById('modalThinkInput').value;

        // 验证输入
        if (!dialogueText.trim()) {
            this.showMessage('请输入对话内容', 'error');
            return;
        }

        if (this.addDialogue(role, dialogueText, thinkText)) {
            // 关闭模态窗口
            this.closeAddDialogModal();
            
            // 显示成功消息
            this.showMessage('对话添加成功', 'success');
        }
    }
}

// 页面加载完成后初始化对话管理器
document.addEventListener('DOMContentLoaded', () => {
    window.dialogueManager = new DialogueManager();
});